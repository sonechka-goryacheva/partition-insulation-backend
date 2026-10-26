import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { PartitionUserEntity } from '../src/entities/partition-user.entity';
import { PartitionSystemEntity } from '../src/entities/partition-system.entity';
import { PartitionLikeEntity } from '../src/entities/partition-like.entity';
import { PartitionAttributeEntity } from '../src/entities/partition-attribute.entity';
import { PartitionAttributeValueEntity } from '../src/entities/partition-attribute-value.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    PartitionUserEntity,
    PartitionSystemEntity,
    PartitionLikeEntity,
    PartitionAttributeEntity,
    PartitionAttributeValueEntity,
  ],
  synchronize: true,
});

async function run() {
  await dataSource.initialize();
  await dataSource.synchronize();
  console.log('Миграции выполнены успешно.');

  // bootstrap only, not the required Adminer fill-in —
  // техническая заглушка, чтобы FK partition_creator_id имел на что ссылаться.
  // Пароль engineer123 хранится в виде хеша bcrypt
  const passwordHash = await bcrypt.hash('engineer123', 10);
  await dataSource.query(
    `
    INSERT INTO partition_user (partition_user_id, partition_user_login, partition_user_name, partition_user_password)
    VALUES (1, 'engineer', 'Тестовый инженер', $1)
    ON CONFLICT DO NOTHING;
  `,
    [passwordHash],
  );
  // id=1 вставлен явно, поэтому счётчик автонумерации сдвигаем вручную,
  // иначе следующая регистрация получит тот же id и упадёт на дубле ключа
  await dataSource.query(`
    SELECT setval(pg_get_serial_sequence('partition_user', 'partition_user_id'),
                  (SELECT MAX(partition_user_id) FROM partition_user));
  `);
  console.log('Тестовый пользователь id=1 готов.');

  // Справочник атрибутов (дополнительные характеристики конструкций)
  await dataSource.query(`
    INSERT INTO partition_attribute (partition_attribute_name, partition_attribute_unit) VALUES
      ('Поверхностная масса', 'кг/м²'),
      ('Предел огнестойкости', NULL),
      ('Материал обшивки', NULL),
      ('Заполнение', NULL),
      ('Тип каркаса', NULL)
    ON CONFLICT (partition_attribute_name) DO NOTHING;
  `);
  console.log('Справочник атрибутов готов.');

  await dataSource.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('Ошибка миграций:', err);
  process.exit(1);
});
