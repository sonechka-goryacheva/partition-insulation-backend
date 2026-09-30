import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Вход (заглушка до ЛР-4): формат запроса фиксируется уже сейчас
export class LoginPartitionUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  partitionUserLogin: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  partitionUserPassword: string;
}
