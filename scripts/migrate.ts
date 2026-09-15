import { DataSource } from 'typeorm';
import { PartitionUserEntity } from '../src/partitions/entities/partition-user.entity';
import { PartitionSystemEntity } from '../src/partitions/entities/partition-system.entity';
import { PartitionLikeEntity } from '../src/partitions/entities/partition-like.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [PartitionUserEntity, PartitionSystemEntity, PartitionLikeEntity],
  synchronize: true,
});

async function run() {
  await dataSource.initialize();
  await dataSource.synchronize();
  console.log('Миграции выполнены успешно.');

  // bootstrap only, not the required Adminer fill-in —
  // техническая заглушка, чтобы FK partition_creator_id имел на что ссылаться
  await dataSource.query(`
    INSERT INTO partition_user (partition_user_id, partition_user_login, partition_user_name, partition_user_role)
    VALUES (1, 'engineer', 'Тестовый инженер', 'designEngineer')
    ON CONFLICT DO NOTHING;
  `);
  console.log('Тестовый пользователь id=1 готов.');

  await dataSource.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('Ошибка миграций:', err);
  process.exit(1);
});
