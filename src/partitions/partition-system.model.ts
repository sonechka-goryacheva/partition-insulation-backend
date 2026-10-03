// Статусы конструкции перегородки
export type PartitionStatus = 'draft' | 'published' | 'removed';

// Модель услуги: конструкция перегородки с толщиной и индексом изоляции воздушного шума
export interface PartitionSystem {
  partitionSystemId: number;
  partitionName: string;
  partitionThicknessMm: number;  // толщина перегородки, мм
  soundIndexRw: number;          // индекс изоляции воздушного шума Rw, дБ
  partitionDescription: string;
  partitionPhotoUrl: string;     // адрес фото
  partitionVideoUrl: string;     // адрес видео
  partitionStatus: PartitionStatus;
  partitionLikes: number[];      // вложенный массив ID пользователей
}
