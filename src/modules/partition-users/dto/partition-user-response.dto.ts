import type { PartitionUserRole } from '../../../entities/partition-user.entity';

// Ответ с данными пользователя: пароль не передаётся никогда
export class PartitionUserResponseDto {
  partitionUserId: number;
  partitionUserLogin: string;
  partitionUserName: string;
  partitionUserRole: PartitionUserRole;

  constructor(fields: PartitionUserResponseDto) {
    Object.assign(this, fields);
  }
}
