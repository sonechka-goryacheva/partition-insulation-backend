import { Body, Controller, Get, Param, Post, Query, Redirect, Render } from '@nestjs/common';
import { PartitionsService, PartitionSystemView } from './partitions.service';
import { PARTITION_TYPE_SHORT, PARTITION_TYPE_TITLES } from './partition-system.model';

@Controller('partitions')
export class PartitionsController {
  constructor(private readonly partitionsService: PartitionsService) {}

  // GET /partitions/feed/:partitionSystemId?next=true
  // Без идентификатора открывается первая опубликованная конструкция (переход из панели вкладок)
  @Get(['feed', 'feed/:partitionSystemId'])
  @Render('partition-feed')
  async getPartitionFeed(
    @Param('partitionSystemId') partitionSystemId?: string,
    @Query('next') next?: string,
  ) {
    const publishedPartitions =
      await this.partitionsService.findPublishedPartitions();

    let currentPartition: PartitionSystemView | undefined;

    if (!partitionSystemId) {
      currentPartition = publishedPartitions[0];
    } else if (next === 'true') {
      currentPartition = await this.partitionsService.findNextPublishedPartition(
        Number(partitionSystemId),
      );
    } else {
      currentPartition = await this.partitionsService.findPublishedPartitionById(
        Number(partitionSystemId),
      );
    }

    if (!currentPartition) {
      currentPartition = publishedPartitions[0];
    }

    return {
      pageTitle: 'Лента',
      isFeedActive: true,
      partition: {
        partitionSystemId: currentPartition.partitionSystemId,
        partitionName: currentPartition.partitionName,
        partitionDescription: currentPartition.partitionDescription,
        soundIndexRw: currentPartition.soundIndexRw,
        partitionTypeShort: PARTITION_TYPE_SHORT[currentPartition.partitionType],
        partitionLikesCount:
          this.partitionsService.countPartitionLikes(currentPartition),
        partitionPhotoUrl:
          this.partitionsService.buildPartitionPhotoUrl(currentPartition),
        partitionVideoUrl:
          this.partitionsService.buildPartitionVideoUrl(currentPartition),
      },
    };
  }

  // GET /partitions/draft — черновая конструкция на странице добавления
  @Get('draft')
  @Render('partition-create')
  async getPartitionDraft() {
    const draftPartition = await this.partitionsService.findDraftPartition();

    if (!draftPartition) {
      return {
        pageTitle: 'Добавить конструкцию',
        isCreateActive: true,
        partition: null,
      };
    }

    return {
      pageTitle: 'Добавить конструкцию',
      isCreateActive: true,
      partition: {
        partitionName: draftPartition.partitionName,
        partitionDescription: draftPartition.partitionDescription,
        soundIndexRw: draftPartition.soundIndexRw,
        partitionTypeTitle: PARTITION_TYPE_TITLES[draftPartition.partitionType],
        partitionPhotoUrl:
          this.partitionsService.buildPartitionPhotoUrl(draftPartition),
        partitionVideoUrl:
          this.partitionsService.buildPartitionVideoUrl(draftPartition),
        isGypsum: draftPartition.partitionType === 'gypsum',
        isAeratedConcrete: draftPartition.partitionType === 'aeratedConcrete',
        isBrick: draftPartition.partitionType === 'brick',
      },
    };
  }

  // POST /partitions/draft — создание черновика текущего пользователя (кнопка «Далее»)
  @Post('draft')
  @Redirect('/partitions/draft')
  async createPartitionDraft(@Body('partitionName') partitionName: string) {
    await this.partitionsService.createDraftPartition(partitionName);
    return {};
  }

  // POST /partitions/publish — публикация черновика (кнопка «Опубликовать»)
  @Post('publish')
  @Redirect('/partitions/draft')
  async publishPartitionDraft(
    @Body('partitionDescription') partitionDescription: string,
    @Body('partitionType') partitionType: string,
    @Body('soundIndexRw') soundIndexRw: string,
  ) {
    await this.partitionsService.publishDraftPartition({
      partitionDescription,
      partitionType,
      soundIndexRw: Number(soundIndexRw),
    });
    return {};
  }

  // POST /partitions/:partitionSystemId/delete — логическое удаление (сырой SQL, без ORM)
  @Post(':partitionSystemId/delete')
  @Redirect('/partitions/catalog')
  async deletePartition(@Param('partitionSystemId') partitionSystemId: string) {
    await this.partitionsService.deletePartitionBySql(Number(partitionSystemId));
    return {};
  }

  // GET /partitions/catalog?rwFrom=52&rwTo=74 — плитка карточек с фильтрацией по диапазону Rw
  @Get('catalog')
  @Render('partition-catalog')
  async getPartitionCatalog(
    @Query('rwFrom') rwFrom?: string,
    @Query('rwTo') rwTo?: string,
  ) {
    const { rwMin, rwMax } = await this.partitionsService.getRwBounds();

    const parseBound = (raw: string | undefined, fallback: number): number => {
      if (raw === undefined || raw === '') return fallback;
      const parsed = Number(raw);
      return Number.isNaN(parsed) ? fallback : parsed;
    };

    const appliedRwFrom = parseBound(rwFrom, rwMin);
    const appliedRwTo = parseBound(rwTo, rwMax);

    const filteredPartitions =
      await this.partitionsService.findPublishedPartitionsByRwRange(
        appliedRwFrom,
        appliedRwTo,
      );

    return {
      pageTitle: 'Каталог перегородок',
      isCatalogActive: true,
      rwMin,
      rwMax,
      rwFrom: appliedRwFrom,
      rwTo: appliedRwTo,
      partitions: filteredPartitions.map((partition) => ({
        partitionSystemId: partition.partitionSystemId,
        partitionName: partition.partitionName,
        soundIndexRw: partition.soundIndexRw,
        partitionTypeTitle: PARTITION_TYPE_TITLES[partition.partitionType],
        partitionLikesCount:
          this.partitionsService.countPartitionLikes(partition),
        partitionPhotoUrl:
          this.partitionsService.buildPartitionPhotoUrl(partition),
      })),
    };
  }
}
