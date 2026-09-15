import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { PartitionUserEntity } from './partition-user.entity';

@Entity('partition_system')
@Check(`"partition_status" IN ('draft', 'published', 'removed')`)
@Index('uq_one_draft_per_user', ['partition_creator_id'], {
  unique: true,
  where: `"partition_status" = 'draft'`,
})
export class PartitionSystemEntity {
  @PrimaryGeneratedColumn()
  partition_system_id: number;

  @Column({ type: 'varchar', length: 100 })
  partition_name: string;

  @Column({ type: 'varchar', length: 500 })
  partition_description: string;

  @Column({ type: 'varchar', length: 20 })
  partition_status: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  partition_photo_url: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  partition_video_url: string | null;

  @Column({ type: 'varchar', length: 30 })
  partition_type: string;

  @Column({ type: 'integer' })
  sound_index_rw: number;

  @Column({ type: 'timestamp' })
  partition_created_at: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  partition_formed_at: Date | null;

  @Column({ type: 'integer' })
  partition_creator_id: number;

  @ManyToOne(() => PartitionUserEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'partition_creator_id' })
  creator: PartitionUserEntity;
}
