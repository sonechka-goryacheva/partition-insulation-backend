import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

// Справочник атрибутов конструкции (дополнительные характеристики):
// новый атрибут добавляется строкой, без изменения структуры БД
@Entity('partition_attribute')
@Index('uq_partition_attribute_name', ['partitionAttributeName'], { unique: true })
export class PartitionAttributeEntity {
  @PrimaryGeneratedColumn({ name: 'partition_attribute_id' })
  partitionAttributeId: number;

  @Column({ name: 'partition_attribute_name', type: 'varchar', length: 100 })
  partitionAttributeName: string;

  // Единица измерения; null — атрибут без единицы (например, «Предел огнестойкости»)
  @Column({ name: 'partition_attribute_unit', type: 'varchar', length: 20, nullable: true })
  partitionAttributeUnit: string | null;
}
