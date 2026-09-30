import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PartitionLikeEntity } from '../../../entities/partition-like.entity';

@Injectable()
export class TypeORMPartitionLikesRepository {
  constructor(
    @InjectRepository(PartitionLikeEntity)
    private readonly repository: Repository<PartitionLikeEntity>,
  ) {}

  // Количество лайков для набора конструкций одним запросом GROUP BY
  async countBySystemIds(partitionSystemIds: number[]): Promise<Map<number, number>> {
    const partitionLikesCounts = new Map<number, number>();
    if (partitionSystemIds.length === 0) {
      return partitionLikesCounts;
    }

    const rows: { partitionSystemId: number; partitionLikesCount: string }[] =
      await this.repository
        .createQueryBuilder('partitionLike')
        .select('partitionLike.partitionSystemId', 'partitionSystemId')
        .addSelect('COUNT(*)', 'partitionLikesCount')
        .where('partitionLike.partitionSystemId IN (:...partitionSystemIds)', {
          partitionSystemIds,
        })
        .groupBy('partitionLike.partitionSystemId')
        .getRawMany();

    for (const row of rows) {
      partitionLikesCounts.set(Number(row.partitionSystemId), Number(row.partitionLikesCount));
    }
    return partitionLikesCounts;
  }

  // Какие из конструкций пользователь уже лайкнул (одним запросом)
  async findLikedSystemIds(
    partitionUserId: number,
    partitionSystemIds: number[],
  ): Promise<Set<number>> {
    if (partitionSystemIds.length === 0) {
      return new Set<number>();
    }

    const partitionLikes = await this.repository.find({
      where: { partitionUserId, partitionSystemId: In(partitionSystemIds) },
    });
    return new Set(partitionLikes.map((partitionLike) => partitionLike.partitionSystemId));
  }

  // Поставить лайк: повторная вставка той же пары игнорируется уникальным индексом
  async create(partitionUserId: number, partitionSystemId: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .into(PartitionLikeEntity)
      .values({ partitionUserId, partitionSystemId })
      .orIgnore()
      .execute();
  }

  // Снять лайк: если его не было, ничего не происходит
  async delete(partitionUserId: number, partitionSystemId: number): Promise<void> {
    await this.repository.delete({ partitionUserId, partitionSystemId });
  }
}
