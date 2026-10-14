import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PartitionUsersService } from '../services/partition-users.service';
import { PARTITION_SESSION_COOKIE } from '../../partition-sessions/services/partition-session.service';
import type { PartitionRequest } from '../../../common/current-user';

// Гард методов создателя: читает куку partitionSessionId, ищет сессию в Redis
// и записывает пользователя в запрос. Нет куки или сессии — 401 (гость)
@Injectable()
export class PartitionSessionGuard implements CanActivate {
  constructor(private readonly partitionUsersService: PartitionUsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<PartitionRequest>();
    const sessionId = req.cookies?.[PARTITION_SESSION_COOKIE];
    if (!sessionId) {
      throw new UnauthorizedException();
    }

    const partitionUser = await this.partitionUsersService.validateSession(sessionId);
    req.partitionCurrentUser = {
      partitionUserId: partitionUser.partitionUserId,
      partitionUserLogin: partitionUser.partitionUserLogin,
    };
    return true;
  }
}
