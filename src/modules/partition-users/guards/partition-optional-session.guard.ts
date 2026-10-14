import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PartitionUsersService } from '../services/partition-users.service';
import { PARTITION_SESSION_COOKIE } from '../../partition-sessions/services/partition-session.service';
import type { PartitionRequest } from '../../../common/current-user';

// Гард методов чтения: доступ есть у всех, в том числе у гостя.
// Если сессия действительна, пользователь записывается в запрос —
// для признаков partitionIsLiked и partitionIsMine
@Injectable()
export class PartitionOptionalSessionGuard implements CanActivate {
  constructor(private readonly partitionUsersService: PartitionUsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<PartitionRequest>();
    const sessionId = req.cookies?.[PARTITION_SESSION_COOKIE];
    if (sessionId) {
      try {
        const partitionUser = await this.partitionUsersService.validateSession(sessionId);
        req.partitionCurrentUser = {
          partitionUserId: partitionUser.partitionUserId,
          partitionUserLogin: partitionUser.partitionUserLogin,
        };
      } catch {
        // Сессия истекла или удалена — запрос выполняется как от гостя
      }
    }
    return true;
  }
}
