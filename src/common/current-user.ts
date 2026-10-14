import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

// Текущий пользователь, определённый по сессии в Redis (ЛР-4).
// Заменил функцию-singleton getPartitionCurrentUser() с фиксированным id = 1 из ЛР-3
export interface PartitionCurrentUser {
  readonly partitionUserId: number;
  readonly partitionUserLogin: string;
}

// Запрос, в который гард сессии записал текущего пользователя
export type PartitionRequest = Request & { partitionCurrentUser?: PartitionCurrentUser };

// Декоратор параметра: текущий пользователь из запроса; null — гость (сессии нет)
export const PartitionSessionUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PartitionCurrentUser | null => {
    const req = context.switchToHttp().getRequest<PartitionRequest>();
    return req.partitionCurrentUser ?? null;
  },
);
