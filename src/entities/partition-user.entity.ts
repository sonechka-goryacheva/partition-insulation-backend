import { Entity, PrimaryGeneratedColumn, Column, Check, Index } from 'typeorm';
import { Exclude } from 'class-transformer';

// Роли пользователей системы расчёта звукоизоляции
export const PARTITION_USER_ROLES = ['guest', 'designEngineer', 'acousticManager'] as const;
export type PartitionUserRole = (typeof PARTITION_USER_ROLES)[number];

@Entity('partition_user')
@Check(`"partition_user_role" IN ('guest', 'designEngineer', 'acousticManager')`)
// Логин уникален: второй пользователь с тем же логином не зарегистрируется
@Index('uq_partition_user_login', ['partitionUserLogin'], { unique: true })
export class PartitionUserEntity {
  @PrimaryGeneratedColumn({ name: 'partition_user_id' })
  partitionUserId: number;

  @Column({ name: 'partition_user_login', type: 'varchar', length: 50 })
  partitionUserLogin: string;

  @Column({ name: 'partition_user_name', type: 'varchar', length: 100 })
  partitionUserName: string;

  // Пароль никогда не уходит клиенту
  @Exclude()
  @Column({ name: 'partition_user_password', type: 'varchar', length: 255 })
  partitionUserPassword: string;

  @Column({ name: 'partition_user_role', type: 'varchar', length: 30 })
  partitionUserRole: PartitionUserRole;
}
