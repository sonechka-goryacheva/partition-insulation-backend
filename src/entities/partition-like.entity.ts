import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PartitionUserEntity } from './partition-user.entity';
import { PartitionSystemEntity } from './partition-system.entity';

// Лайк м-м пользователь–конструкция: одна пара не может повторяться
@Entity('partition_like')
@Index('uq_partition_like_user_system', ['partitionUserId', 'partitionSystemId'], {
  unique: true,
})
export class PartitionLikeEntity {
  @PrimaryGeneratedColumn({ name: 'partition_like_id' })
  partitionLikeId: number;

  @Column({ name: 'partition_user_id', type: 'integer' })
  partitionUserId: number;

  @Column({ name: 'partition_system_id', type: 'integer' })
  partitionSystemId: number;

  @ManyToOne(() => PartitionUserEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'partition_user_id' })
  partitionUser: PartitionUserEntity;

  @ManyToOne(() => PartitionSystemEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'partition_system_id' })
  partitionSystem: PartitionSystemEntity;
}
