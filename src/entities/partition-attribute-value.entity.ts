import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PartitionSystemEntity } from './partition-system.entity';
import { PartitionAttributeEntity } from './partition-attribute.entity';

// Значение атрибута конструкции — вертикальная таблица, связь м-м конструкция–атрибут:
// у одной конструкции каждый атрибут встречается не более одного раза
@Entity('partition_attribute_value')
@Index('uq_partition_attribute_value_system_attribute', ['partitionSystemId', 'partitionAttributeId'], {
  unique: true,
})
export class PartitionAttributeValueEntity {
  @PrimaryGeneratedColumn({ name: 'partition_attribute_value_id' })
  partitionAttributeValueId: number;

  @Column({ name: 'partition_system_id', type: 'integer' })
  partitionSystemId: number;

  @Column({ name: 'partition_attribute_id', type: 'integer' })
  partitionAttributeId: number;

  @Column({ name: 'partition_attribute_value', type: 'varchar', length: 255 })
  partitionAttributeValue: string;

  @ManyToOne(() => PartitionSystemEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'partition_system_id' })
  partitionSystem: PartitionSystemEntity;

  @ManyToOne(() => PartitionAttributeEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'partition_attribute_id' })
  partitionAttribute: PartitionAttributeEntity;
}
