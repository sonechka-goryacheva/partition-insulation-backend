import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Регистрация: id назначается в БД, пароль сохраняется в виде хеша bcrypt
export class RegisterPartitionUserDto {
  @ApiProperty({ description: 'Латиница, цифры и _, от 3 до 50 символов', example: 'engineer_petrov' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,50}$/)
  partitionUserLogin: string;

  @ApiProperty({ maxLength: 100, example: 'Петров Иван' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  partitionUserName: string;

  @ApiProperty({ minLength: 6, maxLength: 255, example: 'secret123' })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  partitionUserPassword: string;
}
