import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { PartitionUserEntity } from './partition-user.entity';

// Статусы конструкции перегородки
export const PARTITION_STATUSES = ['draft', 'published', 'removed'] as const;
export type PartitionStatus = (typeof PARTITION_STATUSES)[number];

@Entity('partition_system')
@Check(`"partition_status" IN ('draft', 'published', 'removed')`)
@Index('uq_one_draft_per_user', ['partitionCreatorId'], {
  unique: true,
  where: `"partition_status" = 'draft'`,
})
export class PartitionSystemEntity {
  @PrimaryGeneratedColumn({ name: 'partition_system_id' })
  partitionSystemId: number;

  @Column({ name: 'partition_name', type: 'varchar', length: 100 })
  partitionName: string;

  @Column({ name: 'partition_description', type: 'varchar', length: 500, nullable: true, default: null })
  partitionDescription: string | null;

  // Статус хранится только в БД, клиенту не передаётся
  @Exclude()
  @Column({ name: 'partition_status', type: 'varchar', length: 20 })
  partitionStatus: PartitionStatus;

  // Латинское имя файла (ключ объекта в MinIO), а не URL; фото и видео обязательны
  @Column({ name: 'partition_photo_key', type: 'varchar', length: 255 })
  partitionPhotoKey: string;

  @Column({ name: 'partition_video_key', type: 'varchar', length: 255 })
  partitionVideoKey: string;

  // Толщина перегородки, мм (заполняется при публикации)
  @Column({ name: 'partition_thickness_mm', type: 'integer', nullable: true, default: null })
  partitionThicknessMm: number | null;

  // Индекс изоляции воздушного шума Rw, дБ
  @Column({ name: 'sound_index_rw', type: 'integer', nullable: true, default: null })
  soundIndexRw: number | null;

  @Column({ name: 'partition_created_at', type: 'timestamp' })
  partitionCreatedAt: Date;

  @Column({ name: 'partition_formed_at', type: 'timestamp', nullable: true, default: null })
  partitionFormedAt: Date | null;

  @Column({ name: 'partition_creator_id', type: 'integer' })
  partitionCreatorId: number;

  @ManyToOne(() => PartitionUserEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'partition_creator_id' })
  partitionCreator: PartitionUserEntity;
}
