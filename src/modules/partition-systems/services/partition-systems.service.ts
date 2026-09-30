import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { getPartitionCurrentUser } from '../../../common/current-user';
import { PartitionSystemEntity } from '../../../entities/partition-system.entity';
import { TypeORMPartitionSystemsRepository } from '../repositories/typeorm-partition-systems.repository';
import { TypeORMPartitionLikesRepository } from '../repositories/typeorm-partition-likes.repository';
import { PartitionMinioService } from './partition-minio.service';
import { PartitionSystemFiltersDto } from '../dto/partition-system-filters.dto';
import { PartitionSystemResponseDto } from '../dto/partition-system-response.dto';
import { CreatePartitionSystemDto } from '../dto/create-partition-system.dto';
import { PublishPartitionSystemDto } from '../dto/publish-partition-system.dto';
import { PartitionLikeDto } from '../dto/partition-like.dto';

// Файлы из формы создания черновика (FileFieldsInterceptor)
export interface PartitionMediaFiles {
  partitionPhoto?: Express.Multer.File[];
  partitionVideo?: Express.Multer.File[];
}

// Код PostgreSQL для нарушения уникальности (второй черновик у пользователя)
const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class PartitionSystemsService {
  constructor(
    private readonly partitionSystemsRepository: TypeORMPartitionSystemsRepository,
    private readonly partitionLikesRepository: TypeORMPartitionLikesRepository,
    private readonly partitionMinioService: PartitionMinioService,
  ) {}

  // Список опубликованных конструкций с фильтром по диапазону Rw
  async findPublished(filters: PartitionSystemFiltersDto): Promise<PartitionSystemResponseDto[]> {
    const partitionCurrentUser = getPartitionCurrentUser();

    const partitionSystems = await this.partitionSystemsRepository.findPublished(
      filters.rwFrom,
      filters.rwTo,
    );
    return this.toResponseDtos(partitionSystems, partitionCurrentUser.partitionUserId);
  }

  // Лента: без id — первая опубликованная; с id — эта конструкция;
  // с id и next=true — следующая после неё, после последней снова первая
  async getFeed(partitionSystemId?: number, next?: boolean): Promise<PartitionSystemResponseDto> {
    const partitionCurrentUser = getPartitionCurrentUser();

    let partitionSystem: PartitionSystemEntity | null;
    if (partitionSystemId === undefined) {
      partitionSystem = await this.partitionSystemsRepository.findFirstPublished();
    } else if (next) {
      partitionSystem =
        (await this.partitionSystemsRepository.findNextPublished(partitionSystemId)) ??
        (await this.partitionSystemsRepository.findFirstPublished());
    } else {
      partitionSystem = await this.partitionSystemsRepository.findPublishedById(partitionSystemId);
    }

    if (!partitionSystem) {
      throw new NotFoundException();
    }
    return this.toResponseDto(partitionSystem, partitionCurrentUser.partitionUserId);
  }

  // Черновик текущего пользователя (не более одного), id не указывается
  async getDraft(): Promise<PartitionSystemResponseDto> {
    const partitionCurrentUser = getPartitionCurrentUser();

    const partitionDraft = await this.partitionSystemsRepository.findDraftByCreator(
      partitionCurrentUser.partitionUserId,
    );
    if (!partitionDraft) {
      throw new NotFoundException();
    }
    return this.toResponseDto(partitionDraft, partitionCurrentUser.partitionUserId);
  }

  // Создание черновика с фото и видео: файлы в MinIO, ключи в БД.
  // Статус, создатель и дата создания вычисляются здесь, не приходят с клиента
  async createDraft(
    createDto: CreatePartitionSystemDto,
    files: PartitionMediaFiles,
  ): Promise<PartitionSystemResponseDto> {
    const partitionCurrentUser = getPartitionCurrentUser();

    // Не более одного черновика на пользователя
    const existingDraft = await this.partitionSystemsRepository.findDraftByCreator(
      partitionCurrentUser.partitionUserId,
    );
    if (existingDraft) {
      throw new NotFoundException();
    }

    // Оба файла обязательны и должны быть нужного типа
    const partitionPhoto = files?.partitionPhoto?.[0];
    const partitionVideo = files?.partitionVideo?.[0];
    if (
      !partitionPhoto ||
      !partitionVideo ||
      !this.partitionMinioService.isAllowedPartitionMedia(partitionPhoto, 'photo') ||
      !this.partitionMinioService.isAllowedPartitionMedia(partitionVideo, 'video')
    ) {
      throw new BadRequestException();
    }

    // Сначала файлы в MinIO, затем запись в БД; при ошибке файлы удаляются
    const uploadedKeys: string[] = [];
    try {
      const partitionPhotoKey = await this.partitionMinioService.uploadPartitionMedia(partitionPhoto, 'photo');
      uploadedKeys.push(partitionPhotoKey);
      const partitionVideoKey = await this.partitionMinioService.uploadPartitionMedia(partitionVideo, 'video');
      uploadedKeys.push(partitionVideoKey);

      const partitionDraft = await this.partitionSystemsRepository.create({
        partitionName: createDto.partitionName,
        partitionStatus: 'draft',
        partitionPhotoKey,
        partitionVideoKey,
        partitionCreatedAt: new Date(),
        partitionCreatorId: partitionCurrentUser.partitionUserId,
      });
      return this.toResponseDto(partitionDraft, partitionCurrentUser.partitionUserId);
    } catch (error) {
      await Promise.all(uploadedKeys.map((key) => this.partitionMinioService.deleteFile(key)));

      // Параллельный запрос успел создать черновик: сработал уникальный индекс БД
      const driverError = error instanceof QueryFailedError
        ? (error.driverError as { code?: string })
        : undefined;
      if (driverError?.code === POSTGRES_UNIQUE_VIOLATION) {
        throw new NotFoundException();
      }
      throw error;
    }
  }

  // Публикация: только черновик текущего пользователя, draft → published.
  // Обратного перехода в черновик нет
  async publishDraft(publishDto: PublishPartitionSystemDto): Promise<PartitionSystemResponseDto> {
    const partitionCurrentUser = getPartitionCurrentUser();

    const partitionDraft = await this.partitionSystemsRepository.findDraftByCreator(
      partitionCurrentUser.partitionUserId,
    );
    if (!partitionDraft) {
      throw new NotFoundException();
    }

    const partitionPublished = await this.partitionSystemsRepository.update(
      partitionDraft.partitionSystemId,
      {
        partitionDescription: publishDto.partitionDescription,
        partitionType: publishDto.partitionType,
        soundIndexRw: publishDto.soundIndexRw,
        partitionStatus: 'published',
        partitionFormedAt: new Date(),
      },
    );
    return this.toResponseDto(partitionPublished, partitionCurrentUser.partitionUserId);
  }

  // Мягкое удаление: только своя неудалённая конструкция, статус → removed
  async removePartitionSystem(partitionSystemId: number): Promise<void> {
    const partitionCurrentUser = getPartitionCurrentUser();

    const partitionSystem = await this.partitionSystemsRepository.findActiveByIdAndCreator(
      partitionSystemId,
      partitionCurrentUser.partitionUserId,
    );
    if (!partitionSystem) {
      throw new NotFoundException();
    }

    await this.partitionSystemsRepository.softDelete(partitionSystemId);
  }

  // Лайк текущего пользователя: 1 — поставить, 0 — снять.
  // Только для опубликованных; в ответе обновлённая карточка
  async setPartitionLike(
    partitionSystemId: number,
    likeDto: PartitionLikeDto,
  ): Promise<PartitionSystemResponseDto> {
    const partitionCurrentUser = getPartitionCurrentUser();

    const partitionSystem = await this.partitionSystemsRepository.findPublishedById(partitionSystemId);
    if (!partitionSystem) {
      throw new NotFoundException();
    }

    if (likeDto.partitionLike === 1) {
      await this.partitionLikesRepository.create(partitionCurrentUser.partitionUserId, partitionSystemId);
    } else {
      await this.partitionLikesRepository.delete(partitionCurrentUser.partitionUserId, partitionSystemId);
    }

    return this.toResponseDto(partitionSystem, partitionCurrentUser.partitionUserId);
  }

  private async toResponseDto(
    partitionSystem: PartitionSystemEntity,
    partitionUserId: number,
  ): Promise<PartitionSystemResponseDto> {
    const [partitionSystemDto] = await this.toResponseDtos([partitionSystem], partitionUserId);
    return partitionSystemDto;
  }

  // Сущности → единый DTO: лайки двумя запросами на весь набор,
  // подписанные ссылки MinIO вместо ключей, признаки 0/1 для текущего пользователя
  private async toResponseDtos(
    partitionSystems: PartitionSystemEntity[],
    partitionUserId: number,
  ): Promise<PartitionSystemResponseDto[]> {
    const partitionSystemIds = partitionSystems.map((partitionSystem) => partitionSystem.partitionSystemId);

    const [partitionLikesCounts, partitionLikedIds] = await Promise.all([
      this.partitionLikesRepository.countBySystemIds(partitionSystemIds),
      this.partitionLikesRepository.findLikedSystemIds(partitionUserId, partitionSystemIds),
    ]);

    return Promise.all(
      partitionSystems.map(async (partitionSystem) => {
        const [partitionPhotoUrl, partitionVideoUrl] = await Promise.all([
          this.partitionMinioService.getSignedUrl(partitionSystem.partitionPhotoKey),
          this.partitionMinioService.getSignedUrl(partitionSystem.partitionVideoKey),
        ]);

        return new PartitionSystemResponseDto({
          partitionSystemId: partitionSystem.partitionSystemId,
          partitionName: partitionSystem.partitionName,
          partitionDescription: partitionSystem.partitionDescription,
          partitionType: partitionSystem.partitionType,
          soundIndexRw: partitionSystem.soundIndexRw,
          partitionPhotoUrl,
          partitionVideoUrl,
          partitionLikesCount: partitionLikesCounts.get(partitionSystem.partitionSystemId) ?? 0,
          partitionIsLiked: partitionLikedIds.has(partitionSystem.partitionSystemId) ? 1 : 0,
          partitionIsMine: partitionSystem.partitionCreatorId === partitionUserId ? 1 : 0,
        });
      }),
    );
  }
}
