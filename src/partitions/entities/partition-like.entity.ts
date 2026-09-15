import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PartitionUserEntity } from './partition-user.entity';
import { PartitionSystemEntity } from './partition-system.entity';

@Entity('partition_like')
export class PartitionLikeEntity {
  @PrimaryGeneratedColumn()
  partition_like_id: number;

  @Column({ type: 'integer' })
  partition_user_id: number;

  @Column({ type: 'integer' })
  partition_system_id: number;

  @ManyToOne(() => PartitionUserEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'partition_user_id' })
  user: PartitionUserEntity;

  @ManyToOne(() => PartitionSystemEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'partition_system_id' })
  system: PartitionSystemEntity;
}
