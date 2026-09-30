import { DataSource } from 'typeorm';
import { PartitionUserEntity } from '../src/entities/partition-user.entity';
import { PartitionSystemEntity } from '../src/entities/partition-system.entity';
import { PartitionLikeEntity } from '../src/entities/partition-like.entity';

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
    INSERT INTO partition_user (partition_user_id, partition_user_login, partition_user_name, partition_user_password, partition_user_role)
    VALUES (1, 'engineer', 'Тестовый инженер', 'engineer123', 'designEngineer')
    ON CONFLICT DO NOTHING;
  `);
  // id=1 вставлен явно, поэтому счётчик автонумерации сдвигаем вручную,
  // иначе следующая регистрация получит тот же id и упадёт на дубле ключа
  await dataSource.query(`
    SELECT setval(pg_get_serial_sequence('partition_user', 'partition_user_id'),
                  (SELECT MAX(partition_user_id) FROM partition_user));
  `);
  console.log('Тестовый пользователь id=1 готов.');

  await dataSource.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('Ошибка миграций:', err);
  process.exit(1);
});
