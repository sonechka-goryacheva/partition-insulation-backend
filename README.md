# partition-insulation-backend

Веб-сервис системы расчёта звукоизоляции перегородок (ЛР-3).
Услуга — конструкция перегородки (гипсокартонная, газобетонная, кирпичная) с индексом изоляции воздушного шума Rw, дБ.

Роли: `guest` — гость, `designEngineer` — создатель конструкций, `acousticManager` — модератор.

Стек: NestJS 12, TypeORM, PostgreSQL, MinIO, class-validator / class-transformer.

## Запуск

```bash
docker compose up -d   # PostgreSQL :5432, Adminer :8081, MinIO :9000 (консоль :9001)
npm install
npm run migrate        # только для пустой БД: схема и пользователь id=1
npm run start:dev      # http://localhost:3000/api
```

Переменные `.env`:

| Переменная | Назначение |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | подключение к PostgreSQL |
| `DB_SYNCHRONIZE` | `false`: схема меняется только SQL-скриптами |
| `DB_LOGGING` | логирование SQL-запросов TypeORM |
| `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL` | адрес MinIO |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | учётные данные MinIO |
| `MINIO_BUCKET` | бакет файлов конструкций (`partition-media`) |

Коллекция Postman со всеми методами: `postman/partition-insulation.postman_collection.json`.

## Общие правила API

- Все адреса начинаются с `/api`, данные передаются в JSON (создание черновика — `multipart/form-data`).
- Текущий пользователь до авторизации (ЛР-4) зафиксирован функцией-singleton `getPartitionCurrentUser()` из `src/common/current-user.ts`: id = 1, логин `engineer`.
- Системные поля (id, статус, создатель, даты создания и формирования, роль) с клиента не принимаются: запрос с ними отклоняется с кодом 400. Они вычисляются на бэкенде.
- Конструкции в статусе «удалена» клиенту не передаются.
- Ответ с ошибкой содержит только HTTP-код, тело пустое.

| Код | Когда |
|---|---|
| 200 | успешный запрос |
| 201 | создан черновик или зарегистрирован пользователь |
| 400 | неверный формат запроса: лишние или системные поля, неверный тип, нет обязательного файла |
| 404 | запись не найдена или действие запрещено бизнес-правилами (чужая конструкция, повторный черновик, занятый логин) |
| 413 | файл больше 50 МБ |
| 500 | внутренняя ошибка сервера |

### Единый ответ с конструкцией

Список, лента, черновик, создание, публикация и лайк возвращают одинаковый набор полей. Пустые значения — `null`.

| Поле | Тип | Описание |
|---|---|---|
| `partitionSystemId` | number | идентификатор конструкции |
| `partitionName` | string | название |
| `partitionDescription` | string / null | описание |
| `partitionType` | string / null | тип: `gypsum`, `aeratedConcrete`, `brick` |
| `soundIndexRw` | number / null | индекс изоляции воздушного шума Rw, дБ |
| `partitionPhotoUrl` | string / null | временная подписанная ссылка MinIO на фото (7 дней) |
| `partitionVideoUrl` | string / null | временная подписанная ссылка MinIO на видео (7 дней) |
| `partitionLikesCount` | number | количество лайков |
| `partitionIsLiked` | 0 / 1 | 1, если текущий пользователь поставил лайк |
| `partitionIsMine` | 0 / 1 | 1, если создатель конструкции — текущий пользователь |

## Домен конструкций: `/api/partitions`

| Метод | Адрес | Назначение |
|---|---|---|
| GET | `/api/partitions?rwFrom=&rwTo=` | список опубликованных с фильтром по Rw |
| GET | `/api/partitions/feed` | лента: первая опубликованная |
| GET | `/api/partitions/feed/:partitionSystemId?next=true` | лента: конструкция по id или следующая |
| GET | `/api/partitions/draft` | черновик текущего пользователя |
| POST | `/api/partitions/draft` | создание черновика с фото и видео |
| PUT | `/api/partitions/draft/publish` | публикация черновика |
| DELETE | `/api/partitions/:partitionSystemId` | мягкое удаление своей конструкции |
| POST | `/api/partitions/:partitionSystemId/like` | лайк (1) или его отмена (0) |

### GET `/api/partitions`

Список опубликованных конструкций, отсортированный по id. Фильтрация выполняется в БД.

Параметры (необязательные): `rwFrom`, `rwTo` — целые числа от 0 до 100, границы включительно.

Ответ `200`: массив конструкций (может быть пустым).

### GET `/api/partitions/feed` и `/api/partitions/feed/:partitionSystemId`

- без id — первая опубликованная конструкция;
- с id — опубликованная конструкция с этим id;
- с id и `?next=true` — следующая опубликованная после этого id; после последней — снова первая.

Ответ `200`: конструкция. `404`: нет опубликованной конструкции (в том числе если id принадлежит черновику или удалённой).

### GET `/api/partitions/draft`

Черновик текущего пользователя (не более одного), id не указывается.

Ответ `200`: конструкция. `404`: черновика нет.

### POST `/api/partitions/draft`

Тело `multipart/form-data`:

| Поле | Тип | Ограничения |
|---|---|---|
| `partitionName` | текст | обязательно, до 100 символов |
| `partitionPhoto` | файл | обязательно: jpeg, png или webp, до 50 МБ |
| `partitionVideo` | файл | обязательно: mp4, webm или mov, до 50 МБ |

Файлы сохраняются в MinIO под сгенерированными латинскими именами `partition-photo-<uuid>.<ext>` и `partition-video-<uuid>.<ext>`. В БД записываются только эти имена. Статус `draft`, создатель и дата создания задаются на бэкенде.

Ответ `201`: созданный черновик. `404`: у пользователя уже есть черновик. `400`: нет файла или неверный тип.

### PUT `/api/partitions/draft/publish`

Тело JSON:

| Поле | Тип | Ограничения |
|---|---|---|
| `partitionDescription` | string | обязательно, до 500 символов |
| `partitionType` | string | `gypsum`, `aeratedConcrete` или `brick` |
| `soundIndexRw` | integer | от 0 до 100 |

Публикуется единственный черновик текущего пользователя: статус `draft` → `published`, дата формирования задаётся на бэкенде. Вернуть конструкцию в черновик нельзя.

Ответ `200`: опубликованная конструкция. `404`: черновика нет.

### DELETE `/api/partitions/:partitionSystemId`

Мягкое удаление: статус меняется на `removed`, запись остаётся в БД. Разрешено только для своей конструкции в статусе `draft` или `published`.

Ответ `200` с пустым телом. `404`: конструкция не найдена, чужая или уже удалена.

### POST `/api/partitions/:partitionSystemId/like`

Тело JSON: `{ "partitionLike": 1 }` — поставить лайк от текущего пользователя, `{ "partitionLike": 0 }` — отменить.
Повторная 1 не создаёт второй лайк, 0 без лайка не является ошибкой. Лайк возможен только для опубликованной конструкции.

Ответ `200`: конструкция с обновлёнными `partitionLikesCount` и `partitionIsLiked`. `404`: конструкция не опубликована или не найдена.

## Домен пользователей: `/api/partition-users`

| Метод | Адрес | Назначение |
|---|---|---|
| POST | `/api/partition-users/register` | регистрация |
| POST | `/api/partition-users/login` | аутентификация (заглушка до ЛР-4) |
| POST | `/api/partition-users/logout` | деавторизация (заглушка до ЛР-4) |

### POST `/api/partition-users/register`

Тело JSON:

| Поле | Тип | Ограничения |
|---|---|---|
| `partitionUserLogin` | string | 3–50 символов: латиница, цифры, `_`; уникален |
| `partitionUserName` | string | обязательно, до 100 символов |
| `partitionUserPassword` | string | 6–255 символов |

Роль `designEngineer` и id назначаются на бэкенде. Пароль пока хранится без хеширования (хеширование — в ЛР-4 вместе с авторизацией).

Ответ `201`: `partitionUserId`, `partitionUserLogin`, `partitionUserName`, `partitionUserRole` (пароль не возвращается). `404`: логин занят.

### POST `/api/partition-users/login`

Тело JSON: `partitionUserLogin`, `partitionUserPassword` (обязательны). Заглушка: ответ `200` с пустым телом, `400` при неверном формате.

### POST `/api/partition-users/logout`

Заглушка: ответ `200` с пустым телом.

## Статусы конструкции

| Статус | Значение | Переход |
|---|---|---|
| `draft` | черновик, не более одного у пользователя | создаётся POST `/draft` |
| `published` | опубликована, видна в списке и ленте | из `draft` через PUT `/draft/publish` |
| `removed` | удалена, клиенту не передаётся | из `draft` или `published` через DELETE |

Перевод в `draft` из других статусов и выход из `removed` невозможны. Статус хранится только в БД и в ответах API не передаётся.

## Таблицы БД

Каскадное удаление запрещено: все внешние ключи `ON DELETE NO ACTION`.

### `partition_user` — пользователи

| Столбец | Тип | NULL | Ограничения | Описание |
|---|---|---|---|---|
| `partition_user_id` | SERIAL | нет | PK | идентификатор |
| `partition_user_login` | VARCHAR(50) | нет | UNIQUE (`uq_partition_user_login`) | логин |
| `partition_user_name` | VARCHAR(100) | нет | | имя |
| `partition_user_password` | VARCHAR(255) | нет | | пароль |
| `partition_user_role` | VARCHAR(30) | нет | CHECK: `guest`, `designEngineer`, `acousticManager` | роль |

### `partition_system` — конструкции перегородок (услуги)

| Столбец | Тип | NULL | Ограничения | Описание |
|---|---|---|---|---|
| `partition_system_id` | SERIAL | нет | PK | идентификатор |
| `partition_name` | VARCHAR(100) | нет | | название |
| `partition_description` | VARCHAR(500) | да | | описание |
| `partition_status` | VARCHAR(20) | нет | CHECK: `draft`, `published`, `removed` | статус |
| `partition_photo_key` | VARCHAR(255) | да | | имя файла фото в MinIO |
| `partition_video_key` | VARCHAR(255) | да | | имя файла видео в MinIO |
| `partition_type` | VARCHAR(30) | да | | тип: `gypsum`, `aeratedConcrete`, `brick` |
| `sound_index_rw` | INTEGER | да | | индекс изоляции воздушного шума Rw, дБ |
| `partition_created_at` | TIMESTAMP | нет | | дата создания |
| `partition_formed_at` | TIMESTAMP | да | | дата формирования (публикации) |
| `partition_creator_id` | INTEGER | нет | FK → `partition_user` | создатель |

Частичный уникальный индекс `uq_one_draft_per_user` по `partition_creator_id` при `partition_status = 'draft'`: не более одного черновика на пользователя.

### `partition_like` — лайки (м-м пользователь–конструкция)

| Столбец | Тип | NULL | Ограничения | Описание |
|---|---|---|---|---|
| `partition_like_id` | SERIAL | нет | PK | идентификатор |
| `partition_user_id` | INTEGER | нет | FK → `partition_user` | пользователь |
| `partition_system_id` | INTEGER | нет | FK → `partition_system` | конструкция |

Уникальный индекс `uq_partition_like_user_system` по паре (`partition_user_id`, `partition_system_id`): пользователь ставит конструкции не более одного лайка.

## Хранение файлов

Фото и видео хранятся в MinIO, бакет `partition-media` создаётся при запуске приложения. Бакет закрыт: файлы доступны только по временным подписанным ссылкам, которые сервис генерирует при каждом ответе.

## Структура проекта

```
src/
  main.ts                       префикс /api, ValidationPipe, ClassSerializerInterceptor, фильтр ошибок
  app.module.ts                 конфигурация, TypeORM, модули доменов
  common/
    current-user.ts             функция-singleton текущего пользователя
    partition-http-exception.filter.ts  ошибки без тела
  entities/                     модели TypeORM
  modules/
    partition-systems/          домен конструкций: controllers, services, repositories, dto
    partition-users/            домен пользователей: controllers, services, repositories, dto
scripts/migrate.ts              схема для пустой БД и пользователь id=1
postman/                        коллекция запросов
```
