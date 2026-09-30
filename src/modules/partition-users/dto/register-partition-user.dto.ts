import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

// Регистрация: роль и id назначаются на бэкенде (designEngineer)
export class RegisterPartitionUserDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,50}$/)
  partitionUserLogin: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  partitionUserName: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  partitionUserPassword: string;
}
