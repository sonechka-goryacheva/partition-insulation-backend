import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { PartitionUsersService } from '../services/partition-users.service';
import {
  PARTITION_SESSION_COOKIE,
  PARTITION_SESSION_TTL_SECONDS,
} from '../../partition-sessions/services/partition-session.service';
import { RegisterPartitionUserDto } from '../dto/register-partition-user.dto';
import { LoginPartitionUserDto } from '../dto/login-partition-user.dto';
import { PartitionUserResponseDto } from '../dto/partition-user-response.dto';

@ApiTags('partition-users')
@Controller('partition-users')
export class PartitionUsersController {
  constructor(private readonly partitionUsersService: PartitionUsersService) {}

  // POST /api/partition-users/register — регистрация
  @Post('register')
  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь создан', type: PartitionUserResponseDto })
  @ApiResponse({ status: 400, description: 'Неверный формат или лишние поля' })
  @ApiResponse({ status: 404, description: 'Логин уже занят' })
  async registerPartitionUser(
    @Body() registerDto: RegisterPartitionUserDto,
  ): Promise<PartitionUserResponseDto> {
    return this.partitionUsersService.register(registerDto);
  }

  // POST /api/partition-users/login — аутентификация: сессия в Redis, id сессии в куке
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Аутентификация: создаёт сессию в Redis и ставит куку partitionSessionId' })
  @ApiResponse({ status: 200, description: 'Вход выполнен, кука установлена', type: PartitionUserResponseDto })
  @ApiResponse({ status: 400, description: 'Неверный формат или лишние поля' })
  @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
  async loginPartitionUser(
    @Body() loginDto: LoginPartitionUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PartitionUserResponseDto> {
    const { sessionId, partitionUser } = await this.partitionUsersService.login(loginDto);

    // Повторный вход: прежняя сессия этого браузера больше не нужна
    const previousSessionId = req.cookies?.[PARTITION_SESSION_COOKIE];
    if (previousSessionId) {
      await this.partitionUsersService.logout(previousSessionId);
    }

    res.cookie(PARTITION_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: PARTITION_SESSION_TTL_SECONDS * 1000,
    });
    return partitionUser;
  }

  // POST /api/partition-users/logout — деавторизация: сессия удаляется, кука очищается
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Деавторизация: удаляет сессию из Redis и очищает куку' })
  @ApiResponse({ status: 200, description: 'Выход выполнен' })
  async logoutPartitionUser(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const sessionId = req.cookies?.[PARTITION_SESSION_COOKIE];
    if (sessionId) {
      await this.partitionUsersService.logout(sessionId);
    }
    res.clearCookie(PARTITION_SESSION_COOKIE);
  }
}
