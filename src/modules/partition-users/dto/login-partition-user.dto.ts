import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Вход: логин и пароль; при успехе сервер ставит куку partitionSessionId
export class LoginPartitionUserDto {
  @ApiProperty({ example: 'engineer', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  partitionUserLogin: string;

  @ApiProperty({ example: 'engineer123', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  partitionUserPassword: string;
}
