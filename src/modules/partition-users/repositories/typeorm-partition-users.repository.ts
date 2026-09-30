import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartitionUserEntity } from '../../../entities/partition-user.entity';

@Injectable()
export class TypeORMPartitionUsersRepository {
  constructor(
    @InjectRepository(PartitionUserEntity)
    private readonly repository: Repository<PartitionUserEntity>,
  ) {}

  async findById(partitionUserId: number): Promise<PartitionUserEntity | null> {
    return this.repository.findOne({ where: { partitionUserId } });
  }

  async findByLogin(partitionUserLogin: string): Promise<PartitionUserEntity | null> {
    return this.repository.findOne({ where: { partitionUserLogin } });
  }

  async create(data: Partial<PartitionUserEntity>): Promise<PartitionUserEntity> {
    const partitionUser = this.repository.create(data);
    return this.repository.save(partitionUser);
  }
}
