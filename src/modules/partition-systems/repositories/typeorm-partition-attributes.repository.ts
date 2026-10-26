import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PartitionAttributeEntity } from '../../../entities/partition-attribute.entity';
import { PartitionAttributeValueEntity } from '../../../entities/partition-attribute-value.entity';

@Injectable()
export class TypeORMPartitionAttributesRepository {
  constructor(
    @InjectRepository(PartitionAttributeEntity)
    private readonly attributeRepository: Repository<PartitionAttributeEntity>,
    @InjectRepository(PartitionAttributeValueEntity)
    private readonly valueRepository: Repository<PartitionAttributeValueEntity>,
  ) {}

  // Справочник атрибутов по порядку добавления
  async findAll(): Promise<PartitionAttributeEntity[]> {
    return this.attributeRepository.find({ order: { partitionAttributeId: 'ASC' } });
  }

  // Сколько из переданных id есть в справочнике (проверка перед сохранением значений)
  async countByIds(partitionAttributeIds: number[]): Promise<number> {
    if (partitionAttributeIds.length === 0) {
      return 0;
    }
    return this.attributeRepository.count({ where: { partitionAttributeId: In(partitionAttributeIds) } });
  }

  // Значения атрибутов для набора конструкций одним запросом, вместе с названиями из справочника
  async findValuesBySystemIds(
    partitionSystemIds: number[],
  ): Promise<Map<number, PartitionAttributeValueEntity[]>> {
    const partitionValues = new Map<number, PartitionAttributeValueEntity[]>();
    if (partitionSystemIds.length === 0) {
      return partitionValues;
    }

    const rows = await this.valueRepository.find({
      where: { partitionSystemId: In(partitionSystemIds) },
      relations: { partitionAttribute: true },
      order: { partitionAttributeId: 'ASC' },
    });
    for (const row of rows) {
      const list = partitionValues.get(row.partitionSystemId) ?? [];
      list.push(row);
      partitionValues.set(row.partitionSystemId, list);
    }
    return partitionValues;
  }

  // Полная замена значений атрибутов конструкции в одной транзакции
  async replaceValues(
    partitionSystemId: number,
    values: { partitionAttributeId: number; partitionAttributeValue: string }[],
  ): Promise<void> {
    await this.valueRepository.manager.transaction(async (manager) => {
      await manager.delete(PartitionAttributeValueEntity, { partitionSystemId });
      if (values.length > 0) {
        await manager.insert(
          PartitionAttributeValueEntity,
          values.map((value) => ({ partitionSystemId, ...value })),
        );
      }
    });
  }
}
