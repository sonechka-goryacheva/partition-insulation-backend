// Текущий пользователь-создатель (designEngineer) до авторизации в ЛР-4.
// Функция-singleton: объект создаётся один раз при первом вызове,
// дальше все сервисы получают один и тот же неизменяемый экземпляр.
export interface PartitionCurrentUser {
  readonly partitionUserId: number;
  readonly partitionUserLogin: string;
}

let partitionCurrentUser: PartitionCurrentUser | null = null;

export function getPartitionCurrentUser(): PartitionCurrentUser {
  if (partitionCurrentUser === null) {
    partitionCurrentUser = Object.freeze({
      partitionUserId: 1,
      partitionUserLogin: 'engineer',
    });
  }
  return partitionCurrentUser;
}
