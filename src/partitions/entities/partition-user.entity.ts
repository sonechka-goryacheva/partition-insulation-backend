import { Entity, PrimaryGeneratedColumn, Column, Check } from 'typeorm';

@Entity('partition_user')
@Check(`"partition_user_role" IN ('guest', 'designEngineer', 'acousticManager')`)
export class PartitionUserEntity {
  @PrimaryGeneratedColumn()
  partition_user_id: number;

  @Column({ type: 'varchar', length: 50 })
  partition_user_login: string;

  @Column({ type: 'varchar', length: 100 })
  partition_user_name: string;

  @Column({ type: 'varchar', length: 255 })
  partition_user_password: string;

  @Column({ type: 'varchar', length: 30 })
  partition_user_role: string;
}
