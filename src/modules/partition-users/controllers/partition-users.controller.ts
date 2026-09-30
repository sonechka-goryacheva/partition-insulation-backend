import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PartitionUsersService } from '../services/partition-users.service';
import { RegisterPartitionUserDto } from '../dto/register-partition-user.dto';
import { LoginPartitionUserDto } from '../dto/login-partition-user.dto';
import { PartitionUserResponseDto } from '../dto/partition-user-response.dto';

@Controller('partition-users')
export class PartitionUsersController {
  constructor(private readonly partitionUsersService: PartitionUsersService) {}

  // POST /api/partition-users/register — регистрация
  @Post('register')
  async registerPartitionUser(
    @Body() registerDto: RegisterPartitionUserDto,
  ): Promise<PartitionUserResponseDto> {
    return this.partitionUsersService.register(registerDto);
  }

  // POST /api/partition-users/login — аутентификация (заглушка до ЛР-4)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginPartitionUser(@Body() loginDto: LoginPartitionUserDto): Promise<void> {
    await this.partitionUsersService.login(loginDto);
  }

  // POST /api/partition-users/logout — деавторизация (заглушка до ЛР-4)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logoutPartitionUser(): Promise<void> {
    await this.partitionUsersService.logout();
  }
}
