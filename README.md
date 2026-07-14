# Testimonial Management API

## Требования

- Node.js >= 20
- MongoDB (локально или через `MONGODB_URI`, например MongoDB Atlas)

## Инструкция по установке и запуску проекта

1. Клонировать репозиторий
   git clone <url>
   cd <repository-name>
2. `npm i`
3. Создать `.env` file в корне с необходимыми переменными окружения
4. `npm start`

- `npm test` — запуск тестов
- `npm run test:coverage` — тесты с отчётом по покрытию
- `npm run format` — форматирование через Prettier
- `npm run lint` — проверка ESLint
- `npm run lint:fix` — автоисправление ESLint

## Переменные окружения

| Переменная    | Обязательна        | Описание                     |
| ------------- | ------------------ | ---------------------------- |
| `PORT`        | да                 | порт сервера                 |
| `MONGODB_URI` | да                 | строка подключения к MongoDB |
| `JWT_SECRET`  | да                 | секрет для подписи JWT       |
| `JWT_EXPIRY`  | нет (default `7d`) | время жизни токена           |

Приложение не стартует при отсутствии обязательных переменных (fail-fast проверка в `lib/checkEnv.js`).

## Документация API

### User

**POST** `/api/auth/register` — регистрация нового пользователя.
Принимает `email`, `password`, `businessName`, `role` (опционально, default `owner`) в теле.

`isActive` **не принимается от клиента** — это служебное поле (default `true`), выставляется только на уровне сервера и не может быть передано или изменено через API регистрации.

Пароль должен быть от 8 до 72 символов (ограничение 72 связано с тем, что bcrypt игнорирует байты после этой длины).

```json
POST http://localhost:3000/api/auth/register
content-type: application/json

{
    "email": "john@email.com",
    "password": "SecurePass123",
    "businessName": "company",
    "role": "staff"
}
```

Ответ (содержит только `userId` и `email` — остальные поля пользователя, включая `role`, `businessName`, `_id`, `isActive`, таймстемпы и `__v`, намеренно не возвращаются клиенту и не попадают в JWT):

```json
{
    "code": 201,
    "status": "success",
    "message": "User created",
    "data": {
        "user": {
            "userId": 25,
            "email": "john@email.com"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**POST** `/api/auth/login` — авторизация и получение JWT-токена. Принимает `email` и `password` в теле запроса.

```json
{
    "code": 200,
    "status": "success",
    "message": "Successfully logged in",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

Все защищённые эндпоинты (`/api/testimonials/*`) требуют заголовок `Authorization: Bearer <token>`. На каждый запрос middleware `auth` подгружает пользователя из БД заново и проверяет `isActive` — если пользователь деактивирован или удалён, запрос отклоняется с `401`, даже если сам JWT ещё не истёк. Это защищает от ситуации, когда ранее выданный токен продолжает работать после деактивации аккаунта.

### Testimonial

**POST** `/api/testimonials` — создать новый отзыв.
Принимает `customerName`, `customerEmail`, `customerPhone`, `videoUrl`, `rating`, `text`, `consentGiven` в теле.

```json
POST http://localhost:3000/api/testimonials HTTP/1.1
content-type: application/json
Authorization: Bearer <token>

{
    "customerName": "Neil",
    "customerEmail": "dsa@dsa.com",
    "customerPhone": "123456789",
    "videoUrl": "https://example.com/video",
    "rating": 3,
    "text": "Something as a text",
    "consentGiven": false
}
```

**GET** `/api/testimonials` — список отзывов авторизованного пользователя.
Принимает `status`, `page`, `limit` (1–100), `sort` (allowlist: `createdAt`, `updatedAt`, `rating`, `customerName`, `status`) в query.

```json
GET http://localhost:3000/api/testimonials?status=draft&page=1&limit=5 HTTP/1.1
Authorization: Bearer <token>

Ответ:
{
  "code": 200,
  "status": "success",
  "message": "User's testimonials",
  "data": [],
  "pagination": { "total": 5, "page": 1, "limit": 5, "pages": 1 }
}
```

**GET** `/api/testimonials/:testimonialId` — получить один отзыв по ID.

**PUT** `/api/testimonials/:testimonialId` — частичное обновление отзыва. Принимает любое подмножество `customerName`, `customerEmail`, `customerPhone`, `videoUrl`, `rating`, `text`, `consentGiven`. Пустое тело запроса отклоняется с `400`.

**PATCH** `/api/testimonials/:testimonialId/status` — обновить статус. Принимает `status`. Переходы строго последовательны согласно доменной карте (см. раздел «Архитектурные решения»).

**DELETE** `/api/testimonials/:testimonialId` — мягкое удаление (soft delete).

**POST** `/api/testimonials/:testimonialId/share` — записать действие шаринга. Принимает массив строк `channels`. Разрешено только для отзывов в статусе `completed`/`shared`. Каналы объединяются с уже существующими, а не перезаписываются.

### Testimonial settings

**GET** `/api/testimonials/settings` — получить настройки авторизованного пользователя (`null`, если ещё не созданы).

**POST** `/api/testimonials/settings` — создать или атомарно обновить настройки (MongoDB `findOneAndUpdate` с `upsert`, устойчив к параллельным первым запросам). Всегда возвращает `200`. Принимает `isEnabled`, `defaultVideoLength`, `videoLengthOptions`, `questionnaire`, `sendingOptions`, `thankYouMessage`, `contactConsent` — частичное обновление, вложенные поля (`contactConsent.*`) мержатся, а не перезаписываются целиком.

```json
POST http://localhost:3000/api/testimonials/settings HTTP/1.1
Authorization: Bearer <token>

{
    "videoLengthOptions": [15, 30],
    "isEnabled": true
}
```

### Analytics

**GET** `/api/testimonials/analytics` — аналитика по отзывам за период (`startDate`/`endDate`, ISO 8601, опционально). `byStatus` всегда содержит **все** статусы из домена, включая нулевые:

```json
{
    "code": 200,
    "status": "success",
    "message": "Fetched analytics successfully",
    "data": {
        "overview": {
            "total": 6,
            "byStatus": {
                "draft": 5,
                "recording": 0,
                "processing": 0,
                "completed": 0,
                "shared": 1
            },
            "averageRating": 5
        },
        "period": {
            "startDate": "2025-01-01T12:00:00.000Z",
            "endDate": "2028-02-01T12:00:00.000Z"
        }
    }
}
```

## Архитектурные решения

- **`ApiResponse`** — единый формат HTTP-ответов, чтобы клиент API мог полагаться на стабильную структуру (`code`, `status`, `message`, опционально `data`).
- **`express-validator` (`checkSchema`)** — выбран вместо validation chains за читаемость при большом числе полей и кейсов.
- **`validateSchema` middleware** — переиспользуемая обёртка над `checkSchema` + `validationResult`.
- **Централизованный `errorHandler`** — устраняет дублирование `try/catch`-обработки по контроллерам; сервисы бросают `AppError` с явным `statusCode`, Mongoose-ошибки (`ValidationError`, `CastError`, `11000`) распознаются автоматически.
- **`Counter`-коллекция для `userId`** — в MongoDB нет нативного auto-increment. Атомарный `findOneAndUpdate` с `$inc` устраняет race condition, которая была бы при чтении текущего максимума из коллекции `User`. Инкремент `Counter` и создание `User` — не единая транзакция (см. «Известные ограничения» ниже), поэтому при сбое между этими шагами возможны пропуски в последовательности `userId` — это осознанный компромисс, а не дефект.
- **Soft delete** для отзывов (`isDeleted`/`deletedAt`) — сохраняет историю для потенциальной аналитики удалений и делает удаление обратимым.
- **Двухуровневая валидация**: `express-validator` на входе (быстрый и понятный ответ клиенту) + ограничения на уровне Mongoose-схемы (защита целостности данных для любого пути записи, включая обход HTTP-слоя). Ошибки БД, не пойманные на первом уровне (например, гонка условий на уникальном email), корректно превращаются в `400` централизованным `errorHandler`, а не в `500`.
- **Переходы статусов** — управляются доменной картой `statusTransitions` (см. `lib/statusTransitions.js`), а не порядковым индексом в массиве `statuses`. Это делает связи между статусами явными и не зависящими от порядка объявления в `constants.js`.
- **Сервисный слой** (`services/*`) — контроллеры остаются тонкими (парсинг запроса, вызов сервиса, формирование ответа), вся бизнес-логика и работа с моделями инкапсулирована в сервисах, не зависящих от `req`/`res`.

### Закрытые edge cases

| Кейс                                                                                             | Механизм                                                              | Тест                                                                       |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Нельзя расшарить отзыв со статусом ниже `completed`                                              | проверка статуса в `testimonialService.shareTestimonial`              | `tests/integration/testimonials.test.js`                                   |
| Смена статусов идёт по чёткой цепочке, без пропуска шагов                                        | `canTransitionStatus` / `statusTransitions`                           | `tests/unit/canTransitionStatus.test.js`                                   |
| Каналы при шеринге объединяются, а не перезаписываются                                           | `[...new Set([...existing, ...incoming])]`                            | `tests/integration/testimonials.test.js`                                   |
| `averageRating` нормализован к `0`, если у всех отзывов нет рейтинга                             | `?? 0` после `$avg` в `getOverview`                                   | `tests/integration/analytics.test.js`                                      |
| `byStatus` всегда содержит все статусы, включая нулевые                                          | явный `Object.fromEntries` по домену статусов                         | `tests/integration/analytics.test.js`                                      |
| Mass assignment (`userId`, `status`, `isDeleted`, `_id`, произвольные поля) не проходит в модель | `matchedData` (allowlist по схеме валидации)                          | `tests/integration/security.test.js`                                       |
| Деактивированный пользователь теряет доступ, даже если токен ещё не истёк                        | `auth` middleware проверяет `user.isActive` на каждый запрос          | `tests/integration/authMiddleware.test.js`                                 |
| Race condition на дубликате email / первом upsert настроек                                       | атомарные `findOneAndUpdate` + errorHandler ловит `11000`             | `tests/integration/security.test.js`, `tests/integration/settings.test.js` |
| Пустое тело `PUT` (нет полей для обновления) отклоняется                                         | явная проверка в `testimonialService.updateTestimonial`               | `tests/integration/testimonials.test.js`                                   |
| Повторное мягкое удаление уже удалённого отзыва                                                  | `findTestimonial` фильтрует `isDeleted`, второй запрос получает `404` | `tests/integration/testimonials.test.js`                                   |
| Email нормализуется (`lowercase`) на уровне схемы и валидации                                    | `lowercase: true` в модели + sanitizer в схеме                        | `tests/integration/authRoute.test.js`                                      |
| Fail-fast проверка обязательных env-переменных при старте                                        | `lib/checkEnv.js`                                                     | — (проверяется вручную/при деплое)                                         |
| Generic 500 не раскрывает внутренние детали ошибки                                               | статичное сообщение в `errorHandler`, детали только в логах           | `tests/integration/testimonials.test.js`                                   |

### Известные ограничения

- Инкремент `Counter` и создание `User` выполняются как два отдельных запроса, не в единой транзакции — при сбое между ними возможен пропуск значения в последовательности `userId`. Для тестового задания это признано допустимым (последовательность используется как читаемый идентификатор, не как критичный для консистентности бизнес-ключ)
- Rate limiting настроен на уровне `/api/auth` (5 запросов/минуту) — эндпоинты `/api/testimonials` пока не ограничены отдельно.

## Обзор проделанной работы

- Время выполнения составило ~50 часов
- Rate limiting на auth-эндпоинтах
- Unit-тесты (переходы статусов, `mergeFields`, `ApiResponse`, `AppError`) + интеграционные тесты (CRUD, аналитика, настройки, security/mass-assignment, race conditions) через Jest + Supertest + `mongodb-memory-server`
- Централизованный обработчик ошибок, включая malformed JSON и 404 для неизвестных маршрутов
- ESLint + Prettier
- Бизнес-логика вынесена в сервисный слой
- CI (GitHub Actions): `npm ci` → `npm run lint` → `npm run test:coverage` с порогом покрытия
- Structured logging через `pino` вместо `console.*`
- Graceful shutdown на `SIGTERM`/`SIGINT`

Что сделал бы иначе в следующий раз: использовал бы MongoDB-транзакции для `Counter` + `User`, либо плагин для auto-increment, чтобы полностью исключить пропуски в `userId`.
