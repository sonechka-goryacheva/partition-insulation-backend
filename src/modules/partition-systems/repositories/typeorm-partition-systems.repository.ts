import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import { PartitionSystemEntity } from '../../../entities/partition-system.entity';

@Injectable()
export class TypeORMPartitionSystemsRepository {
  constructor(
    @InjectRepository(PartitionSystemEntity)
    private readonly repository: Repository<PartitionSystemEntity>,
  ) {}

  // Опубликованные конструкции с фильтром по диапазону Rw на стороне БД
  async findPublished(rwFrom?: number, rwTo?: number): Promise<PartitionSystemEntity[]> {
    const query = this.repository
      .createQueryBuilder('partitionSystem')
      .where('partitionSystem.partitionStatus = :status', { status: 'published' });

    if (rwFrom !== undefined) {
      query.andWhere('partitionSystem.soundIndexRw >= :rwFrom', { rwFrom });
    }
    if (rwTo !== undefined) {
      query.andWhere('partitionSystem.soundIndexRw <= :rwTo', { rwTo });
    }

    return query.orderBy('partitionSystem.partitionSystemId', 'ASC').getMany();
  }

  async findPublishedById(partitionSystemId: number): Promise<PartitionSystemEntity | null> {
    return this.repository.findOne({
      where: { partitionSystemId, partitionStatus: 'published' },
    });
  }

  // Первая опубликованная конструкция (лента без идентификатора)
  async findFirstPublished(): Promise<PartitionSystemEntity | null> {
    return this.repository.findOne({
      where: { partitionStatus: 'published' },
      order: { partitionSystemId: 'ASC' },
    });
  }

  // Следующая опубликованная после указанной (лента ?next=true)
  async findNextPublished(partitionSystemId: number): Promise<PartitionSystemEntity | null> {
    return this.repository.findOne({
      where: { partitionSystemId: MoreThan(partitionSystemId), partitionStatus: 'published' },
      order: { partitionSystemId: 'ASC' },
    });
  }

  async findDraftByCreator(partitionCreatorId: number): Promise<PartitionSystemEntity | null> {
    return this.repository.findOne({
      where: { partitionCreatorId, partitionStatus: 'draft' },
    });
  }

  // Неудалённая конструкция конкретного создателя (для удаления)
  async findActiveByIdAndCreator(
    partitionSystemId: number,
    partitionCreatorId: number,
  ): Promise<PartitionSystemEntity | null> {
    return this.repository.findOne({
      where: {
        partitionSystemId,
        partitionCreatorId,
        partitionStatus: In(['draft', 'published']),
      },
    });
  }

  async create(data: Partial<PartitionSystemEntity>): Promise<PartitionSystemEntity> {
    const partitionSystem = this.repository.create(data);
    return this.repository.save(partitionSystem);
  }

  async update(
    partitionSystemId: number,
    data: Partial<PartitionSystemEntity>,
  ): Promise<PartitionSystemEntity> {
    await this.repository.update(partitionSystemId, data);

    const updatedPartitionSystem = await this.repository.findOne({
      where: { partitionSystemId },
    });
    if (!updatedPartitionSystem) {
      throw new Error(`PartitionSystem with id ${partitionSystemId} not found after update`);
    }
    return updatedPartitionSystem;
  }

  // Мягкое удаление: запись остаётся в БД, статус меняется на removed
  async softDelete(partitionSystemId: number): Promise<void> {
    await this.repository.update(partitionSystemId, { partitionStatus: 'removed' });
  }
}
