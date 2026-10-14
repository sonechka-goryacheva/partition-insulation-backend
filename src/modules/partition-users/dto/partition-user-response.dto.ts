import { ApiProperty } from '@nestjs/swagger';

// Ответ с данными пользователя (регистрация и вход): пароль не передаётся никогда
export class PartitionUserResponseDto {
  @ApiProperty({ example: 1 })
  partitionUserId: number;

  @ApiProperty({ example: 'engineer' })
  partitionUserLogin: string;

  @ApiProperty({ example: 'Тестовый инженер' })
  partitionUserName: string;

  constructor(fields: PartitionUserResponseDto) {
    Object.assign(this, fields);
  }
}
