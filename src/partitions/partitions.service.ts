import { Injectable } from '@nestjs/common';
import { PartitionSystem } from './partition-system.model';

// Базовый адрес объектного хранилища MinIO
const MINIO_BUCKET_URL = 'http://localhost:9000/partitions';

// Вспомогательная функция: список ID пользователей, поставивших лайк
function partitionLikeAuthors(total: number): number[] {
  return Array.from({ length: total }, (_, index) => index + 1);
}

@Injectable()
export class PartitionsService {
  // Единственная модель-коллекция приложения, без базы данных
  private readonly partitionSystems: PartitionSystem[] = [
    {
      partitionSystemId: 1,
      partitionName: 'Базовая 1',
      partitionType: 'gypsum',
      soundIndexRw: 52,
      partitionDescription:
        'Каркасная перегородка на одинарном металлическом каркасе с заполнением звукопоглощающим материалом. Применяется для межкомнатных перегородок в жилых и офисных помещениях.',
      partitionPhotoKey: 'bazovaya-1.png',
      partitionVideoKey: 'bazovaya-1.mp4',
      partitionStatus: 'published',
      partitionLikes: partitionLikeAuthors(142),
    },
    {
      partitionSystemId: 2,
      partitionName: 'Стандарт М1',
      partitionType: 'gypsum',
      soundIndexRw: 60,
      partitionDescription:
        'Каркасная перегородка с усиленной обшивкой из звукоизоляционных панелей. Обеспечивает повышенную защиту от воздушного шума между помещениями.',
      partitionPhotoKey: 'standart-m1.png',
      partitionVideoKey: 'standart-m1.mp4',
      partitionStatus: 'published',
      partitionLikes: partitionLikeAuthors(89),
    },
    {
      partitionSystemId: 3,
      partitionName: 'Газобетон D500',
      partitionType: 'aeratedConcrete',
      soundIndexRw: 53,
      partitionDescription:
        'Перегородка из газобетонных блоков плотностью D500 толщиной 200 мм с двусторонней штукатуркой. Сочетает звукоизоляцию и высокий предел огнестойкости.',
      partitionPhotoKey: 'gazobeton-d500.png',
      partitionVideoKey: 'gazobeton-d500.mp4',
      partitionStatus: 'published',
      partitionLikes: partitionLikeAuthors(75),
    },
    {
      partitionSystemId: 4,
      partitionName: 'Профи М1',
      partitionType: 'gypsum',
      soundIndexRw: 74,
      partitionDescription:
        'Перегородка на двойном разнесённом каркасе увеличенной толщины. Применяется в студиях звукозаписи и переговорных комнатах повышенной приватности.',
      partitionPhotoKey: 'profi-m1.png',
      partitionVideoKey: 'profi-m1.mp4',
      partitionStatus: 'published',
      partitionLikes: partitionLikeAuthors(204),
    },
    {
      partitionSystemId: 5,
      partitionName: 'Кирпич полнотелый, 120 мм',
      partitionType: 'brick',
      soundIndexRw: 42,
      partitionDescription:
        'Перегородка из полнотелого керамического кирпича с двусторонней штукатуркой. Черновая запись, на страницу ленты и плитки не выводится.',
      partitionPhotoKey: 'kirpich-120.png',
      partitionVideoKey: 'kirpich-120.mp4',
      partitionStatus: 'draft',
      partitionLikes: partitionLikeAuthors(0),
    },
    {
      partitionSystemId: 6,
      partitionName: 'Газобетон D500, 100 мм',
      partitionType: 'aeratedConcrete',
      soundIndexRw: 41,
      partitionDescription:
        'Перегородка из газобетонных блоков толщиной 100 мм. Запись удалена и в интерфейсе не отображается.',
      partitionPhotoKey: 'gazobeton-100.png',
      partitionVideoKey: 'gazobeton-100.mp4',
      partitionStatus: 'removed',
      partitionLikes: partitionLikeAuthors(18),
    },
  ];

  // Все опубликованные конструкции, упорядоченные по идентификатору
  findPublishedPartitions(): PartitionSystem[] {
    return this.partitionSystems
      .filter((partition) => partition.partitionStatus === 'published')
      .sort((left, right) => left.partitionSystemId - right.partitionSystemId);
  }

  // Фильтрация на сервере по диапазону индекса Rw
  findPublishedPartitionsByRwRange(rwFrom: number, rwTo: number): PartitionSystem[] {
    return this.findPublishedPartitions().filter(
      (partition) =>
        partition.soundIndexRw >= rwFrom && partition.soundIndexRw <= rwTo,
    );
  }

  // Конструкция в статусе «черновик» для страницы добавления
  findDraftPartition(): PartitionSystem | undefined {
    return this.partitionSystems.find(
      (partition) => partition.partitionStatus === 'draft',
    );
  }

  // Конструкция по идентификатору среди опубликованных
  findPublishedPartitionById(
    partitionSystemId: number,
  ): PartitionSystem | undefined {
    return this.findPublishedPartitions().find(
      (partition) => partition.partitionSystemId === partitionSystemId,
    );
  }

  // Следующая опубликованная конструкция после указанной, с переходом по кругу
  findNextPublishedPartition(
    partitionSystemId: number,
  ): PartitionSystem | undefined {
    const publishedPartitions = this.findPublishedPartitions();
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

  // Количество лайков вычисляется по вложенной коллекции ID пользователей
  countPartitionLikes(partition: PartitionSystem): number {
    return partition.partitionLikes.length;
  }

  // Полные адреса медиафайлов в MinIO собираются из ключей модели
  buildPartitionPhotoUrl(partition: PartitionSystem): string {
    return `${MINIO_BUCKET_URL}/${partition.partitionPhotoKey}`;
  }

  buildPartitionVideoUrl(partition: PartitionSystem): string {
    return `${MINIO_BUCKET_URL}/${partition.partitionVideoKey}`;
  }

  // Границы слайдера фильтрации считаются по опубликованным конструкциям
  getRwBounds(): { rwMin: number; rwMax: number } {
    const values = this.findPublishedPartitions().map(
      (partition) => partition.soundIndexRw,
    );
    return {
      rwMin: Math.min(...values),
      rwMax: Math.max(...values),
    };
  }
}
