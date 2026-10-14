import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { Exclude } from 'class-transformer';

// Пользователь системы расчёта звукоизоляции.
// Роли не хранятся: гость — запрос без сессии, создатель — любой вошедший пользователь
@Entity('partition_user')
// Логин уникален: второй пользователь с тем же логином не зарегистрируется
@Index('uq_partition_user_login', ['partitionUserLogin'], { unique: true })
export class PartitionUserEntity {
  @PrimaryGeneratedColumn({ name: 'partition_user_id' })
  partitionUserId: number;

  @Column({ name: 'partition_user_login', type: 'varchar', length: 50 })
  partitionUserLogin: string;

  @Column({ name: 'partition_user_name', type: 'varchar', length: 100 })
  partitionUserName: string;

  // Хеш пароля (bcrypt), никогда не уходит клиенту
  @Exclude()
  @Column({ name: 'partition_user_password', type: 'varchar', length: 255 })
  partitionUserPassword: string;
}
