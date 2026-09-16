import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { PartitionSystemEntity } from './entities/partition-system.entity';
import { PartitionLikeEntity } from './entities/partition-like.entity';
import { PartitionType, PartitionStatus } from './partition-system.model';
import { CURRENT_USER_ID } from '../common/current-user';

// Пока реальные медиа не загружаются — дефолтные файлы лежат в public/
const DEFAULT_PARTITION_PHOTO_URL = '/default-partition.png';
const DEFAULT_PARTITION_VIDEO_URL = '/default-partition.mp4';

// Postgres: нарушение уникального ограничения
const POSTGRES_UNIQUE_VIOLATION = '23505';

// Данные конструкции в форме, которую ожидают контроллер и шаблоны —
// URL и количество лайков уже вычислены, дальше это просто чтение полей
export interface PartitionSystemView {
  partitionSystemId: number;
  partitionName: string;
  partitionDescription: string;
  soundIndexRw: number;
  partitionType: PartitionType;
  partitionStatus: PartitionStatus;
  partitionPhotoUrl: string | null;
  partitionVideoUrl: string | null;
  partitionLikesCount: number;
}

export interface PublishPartitionInput {
  partitionDescription: string;
  partitionType: string;
  soundIndexRw: number;
}

@Injectable()
export class PartitionsService {
  constructor(
    @InjectRepository(PartitionSystemEntity)
    private readonly partitionSystemRepository: Repository<PartitionSystemEntity>,
    @InjectRepository(PartitionLikeEntity)
    private readonly partitionLikeRepository: Repository<PartitionLikeEntity>,
  ) {}

  // Превращает сущность БД в форму, ожидаемую контроллером и шаблонами
  private async toView(
    entity: PartitionSystemEntity,
  ): Promise<PartitionSystemView> {
    const partitionLikesCount = await this.partitionLikeRepository.count({
      where: { partition_system_id: entity.partition_system_id },
    });

    return {
      partitionSystemId: entity.partition_system_id,
      partitionName: entity.partition_name,
      partitionDescription: entity.partition_description,
      soundIndexRw: entity.sound_index_rw,
      partitionType: entity.partition_type as PartitionType,
      partitionStatus: entity.partition_status as PartitionStatus,
      partitionPhotoUrl: entity.partition_photo_url,
      partitionVideoUrl: entity.partition_video_url,
      partitionLikesCount,
    };
  }

  // Все опубликованные конструкции, упорядоченные по идентификатору
  async findPublishedPartitions(): Promise<PartitionSystemView[]> {
    const entities = await this.partitionSystemRepository.find({
      where: { partition_status: 'published' },
      order: { partition_system_id: 'ASC' },
    });
    return Promise.all(entities.map((entity) => this.toView(entity)));
  }

  // Фильтрация на сервере по диапазону индекса Rw
  async findPublishedPartitionsByRwRange(
    rwFrom: number,
    rwTo: number,
  ): Promise<PartitionSystemView[]> {
    const entities = await this.partitionSystemRepository.find({
      where: {
        partition_status: 'published',
        sound_index_rw: Between(rwFrom, rwTo),
      },
      order: { partition_system_id: 'ASC' },
    });
    return Promise.all(entities.map((entity) => this.toView(entity)));
  }

  // Черновик текущего пользователя для страницы добавления
  async findDraftPartition(): Promise<PartitionSystemView | undefined> {
    const entity = await this.partitionSystemRepository.findOne({
      where: {
        partition_status: 'draft',
        partition_creator_id: CURRENT_USER_ID,
      },
    });
    return entity ? this.toView(entity) : undefined;
  }

  // Конструкция по идентификатору среди опубликованных
  async findPublishedPartitionById(
    partitionSystemId: number,
  ): Promise<PartitionSystemView | undefined> {
    const entity = await this.partitionSystemRepository.findOne({
      where: {
        partition_system_id: partitionSystemId,
        partition_status: 'published',
      },
    });
    return entity ? this.toView(entity) : undefined;
  }

  // Следующая опубликованная конструкция после указанной, с переходом по кругу
  async findNextPublishedPartition(
    partitionSystemId: number,
  ): Promise<PartitionSystemView | undefined> {
    const publishedPartitions = await this.findPublishedPartitions();
    if (publishedPartitions.length === 0) {
      return undefined;
    }
    const currentIndex = publishedPartitions.findIndex(
      (partition) => partition.partitionSystemId === partitionSystemId,
    );
    if (currentIndex === -1) {
      return publishedPartitions[0];
    }
    const nextIndex = (currentIndex + 1) % publishedPartitions.length;
    return publishedPartitions[nextIndex];
  }

  // Создание черновика текущего пользователя (кнопка «Далее»)
  // Если черновик уже есть — просто возвращаем его, повторно не создаём
  async createDraftPartition(
    partitionName: string,
  ): Promise<PartitionSystemView> {
    const existingDraft = await this.findDraftPartition();
    if (existingDraft) {
      return existingDraft;
    }

    const draft = this.partitionSystemRepository.create({
      partition_name: partitionName,
      partition_description: '',
      partition_status: 'draft',
      partition_photo_url: null,
      partition_video_url: null,
      partition_type: 'gypsum',
      sound_index_rw: 0,
      partition_created_at: new Date(),
      partition_formed_at: null,
      partition_creator_id: CURRENT_USER_ID,
    });

    try {
      const saved = await this.partitionSystemRepository.save(draft);
      return this.toView(saved);
    } catch (error: any) {
      if (error?.code === POSTGRES_UNIQUE_VIOLATION) {
        throw new ConflictException('У пользователя уже есть черновик');
      }
      throw error;
    }
  }

  // Публикация черновика текущего пользователя (кнопка «Опубликовать»)
  async publishDraftPartition(
    input: PublishPartitionInput,
  ): Promise<PartitionSystemView> {
    const draft = await this.partitionSystemRepository.findOne({
      where: {
        partition_status: 'draft',
        partition_creator_id: CURRENT_USER_ID,
      },
    });

    if (!draft) {
      throw new NotFoundException('Черновик не найден');
    }

    draft.partition_description = input.partitionDescription;
    draft.partition_type = input.partitionType;
    draft.sound_index_rw = input.soundIndexRw;
    draft.partition_status = 'published';
    draft.partition_formed_at = new Date();

    const saved = await this.partitionSystemRepository.save(draft);
    return this.toView(saved);
  }

  // Количество лайков уже вычислено при загрузке — просто читаем поле
  countPartitionLikes(partition: PartitionSystemView): number {
    return partition.partitionLikesCount;
  }

  // Пустой URL в БД — подставляем дефолтный файл из public/
  buildPartitionPhotoUrl(partition: PartitionSystemView): string {
    return partition.partitionPhotoUrl ?? DEFAULT_PARTITION_PHOTO_URL;
  }

  buildPartitionVideoUrl(partition: PartitionSystemView): string {
    return partition.partitionVideoUrl ?? DEFAULT_PARTITION_VIDEO_URL;
  }

  // Логическое удаление — сырой SQL UPDATE, без использования ORM-методов записи
  async deletePartitionBySql(partitionSystemId: number): Promise<void> {
    await this.partitionSystemRepository.manager.query(
      `UPDATE partition_system SET partition_status = 'removed' WHERE partition_system_id = $1`,
      [partitionSystemId],
    );
  }

  // Границы слайдера фильтрации считаются по опубликованным конструкциям
  async getRwBounds(): Promise<{ rwMin: number; rwMax: number }> {
    const publishedPartitions = await this.findPublishedPartitions();
    const values = publishedPartitions.map((partition) => partition.soundIndexRw);
    return {
      rwMin: Math.min(...values),
      rwMax: Math.max(...values),
    };
  }
}
