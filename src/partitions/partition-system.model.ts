// Статусы конструкции перегородки
export type PartitionStatus = 'draft' | 'published' | 'removed';

// Типы конструкций по предметной области
export type PartitionType = 'gypsum' | 'aeratedConcrete' | 'brick';

// Модель услуги: конструкция перегородки с индексом изоляции воздушного шума
export interface PartitionSystem {
  partitionSystemId: number;
  partitionName: string;
  partitionType: PartitionType;
  soundIndexRw: number;          // индекс изоляции воздушного шума Rw, дБ
  partitionDescription: string;
  partitionPhotoKey: string;     // ключ изображения в MinIO
  partitionVideoKey: string;     // ключ видео в MinIO
  partitionStatus: PartitionStatus;
  partitionLikes: number[];      // вложенный массив ID пользователей
}

// Человекочитаемые названия типов перегородок
export const PARTITION_TYPE_TITLES: Record<PartitionType, string> = {
  gypsum: 'Гипсокартонная',
  aeratedConcrete: 'Газобетонная',
  brick: 'Кирпичная',
};

// Короткие названия типов для ромба в ленте
export const PARTITION_TYPE_SHORT: Record<PartitionType, string> = {
  gypsum: 'ГКЛ',
  aeratedConcrete: 'ГБ',
  brick: 'Кирпич',
};
