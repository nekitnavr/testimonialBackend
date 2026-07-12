# Testimonial Management API

## Инструкция по установке и запуску проекта

1. Клонировать репозиторий
    ```
    git clone <url>
    cd <repository-name>
    ```
1. `npm i`
1. Создать .env file в корне с необходимыми переменными окружения
1. `npm start`

- `npm test` для запуска тестов
- `npm format` для запуска prettier
- `npm lint` для проверки ESLint
- `npm lint:fix` для изменений ESLint

## Список необходимых переменных окружения

- PORT - порт сервера
- MONGODB_URI - строка подключения к MongoDB
- JWT_SECRET - секрет для подписи JWT
- JWT_EXPIRY - время жизни токена

## Краткой документацией API (список эндпоинтов с примерами запросов/ответов)

### User

**POST** `/api/auth/register` Регистрация нового пользователя.  
Принимает `email`, `password`, `businessName`, `role`, `isActive` в теле.
Пример запроса и ответа:

```json
POST http://localhost:3000/api/auth/register
content-type: application/json

{
    "email":"john@email.com",
    "password":"123",
    "businessName":"company",
    "role":"staff",
    "isActive":"true"
}

Ответ:
{
  "code": 201,
  "status": "success",
  "message": "User created",
  "data": {
    "user": {
      "userId": 25,
      "email": "asdf@asdf.com",
      "businessName": "company name",
      "role": "owner",
      "isActive": true,
      "_id": "6a4fe478aa0a280112595e3b",
      "createdAt": "2026-07-09T18:12:08.714Z",
      "updatedAt": "2026-07-09T18:12:08.714Z",
      "__v": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI1LCJlbWFpbCI6ImFzZGZAYXNkZi5jb20iLCJpYXQiOjE3ODM2MjA3MjgsImV4cCI6MTc4NDIyNTUyOH0.Se_4a4MVwn9Tmo4VyqgZXZGKAx-dBky7pJqF8QGkWKY"
  }
}
```

**POST** `/api/auth/login` Авторизация и получение JWT токена. Принимает `email` и `password` в теле запроса
Пример ответа:

```json
{
    "code": 200,
    "status": "success",
    "message": "Successfully logged in",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExLCJlbWFpbCI6ImpvaG5AZW1haWwuY29tIiwiaWF0IjoxNzgyNjU1MjUyLCJleHAiOjE3ODMyNjAwNTJ9.u3bNhzzDxCi4iyjF9Rwemph_G_E8yOvSoJjDdiSg7Fg"
    }
}
```

### Testimonial

**POST** `/api/testimonials` Создать новый отзыв.  
Принимает `customerName`,
`customerEmail`,
`customerPhone`,
`videoUrl`,
`rating`,
`text`,
`consentGiven` в теле.  
Пример запроса:

```json
POST http://localhost:3000/api/testimonials HTTP/1.1
content-type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExLCJlbWFpbCI6ImpvaG5AZW1haWwuY29tIiwiaWF0IjoxNzgyNjU1MjUyLCJleHAiOjE3ODMyNjAwNTJ9.u3bNhzzDxCi4iyjF9Rwemph_G_E8yOvSoJjDdiSg7Fg

{
    "customerName": "Neil",
    "customerEmail": "dsa@dsa.com",
    "customerPhone": "123456789",
    "videoUrl": "URL.com/notawebsite",
    "rating": 3,
    "text": "Somethig as a text",
    "consentGiven": false
}
```

**GET** `/api/testimonials` Список отзывов авторизованного пользователя.
Принимает `status`, `page`, `limit` и `sort` в query параметрах.  
Пример запроса и ответа:

```json
GET  http://localhost:3000/api/testimonials?status=draft&page=1&limit=5 HTTP/1.1
content-type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImVtYWlsIjoic2lnbWEzM0B0aGluZy5jb20iLCJpYXQiOjE3ODIzMDY5MTYsImV4cCI6MTc4MjkxMTcxNn0.mS_wESsexUzqBxF6iiuiCnKA1jusfHJFdZvwnk9ODdY

Ответ:
{
  "code": 200,
  "status": "success",
  "message": "User's testimonials",
  "data": [],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 5,
    "pages": 1
  }
}
```

**GET** `/api/testimonials/:testimonialId` Получить один отзыв по ID

**PUT** `/api/testimonials/:testimonialId` Обновить отзыв.  
Принимает `customerName`,
`customerEmail`,
`customerPhone`,
`videoUrl`,
`rating`,
`text`,
`consentGiven` в теле.  
Он реализует частичное обновление согласно фактическому контракту
тестового задания.  
Пример запроса:

```json
PUT  http://localhost:3000/api/testimonials/8ac9936b-46a5-4e22-93be-ddc99ffe378f HTTP/1.1
content-type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExLCJlbWFpbCI6ImpvaG5AZW1haWwuY29tIiwiaWF0IjoxNzgyNjU1MjUyLCJleHAiOjE3ODMyNjAwNTJ9.u3bNhzzDxCi4iyjF9Rwemph_G_E8yOvSoJjDdiSg7Fg

{
    "customerName": "Neil 2",
    "customerEmail": "dsa2@dsa.com",
    "customerPhone": "321456789",
    "videoUrl": "URL.com/notawebsite2",
    "rating": 4,
    "text": "Somethig as a tex2t",
    "consentGiven": true
}
```

**PATCH** `/api/testimonials/:testimonialId/status` Обновить статус отзыва. Принимает `status` в теле запроса.

**DELETE** `/api/testimonials/:testimonialId` Мягкое удаление отзыва

**POST** `/api/testimonials/:testimonialId/share` Записать действие шаринга. Принимает массив строк `channels` в теле запроса.

### Testimonial settings

**GET** `/api/testimonials/settings` Получить настройки авторизованного пользователя

**POST** `/api/testimonials/settings` Создать или обновить настройки.  
Принимает `isEnabled`,
`defaultVideoLength`,
`videoLengthOptions`,
`questionnaire`,
`sendingOptions`,
`thankYouMessage`,
`contactConsent` в теле запроса.
Пример запроса:

```json
POST http://localhost:3000/api/testimonials/settings HTTP/1.1
content-type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImVtYWlsIjoic2lnbWEzM0B0aGluZy5jb20iLCJpYXQiOjE3ODIzMDY5MTYsImV4cCI6MTc4MjkxMTcxNn0.mS_wESsexUzqBxF6iiuiCnKA1jusfHJFdZvwnk9ODdY

{
    "videoLengthOptions": [123, 8888],
    "isEnabled": true
}
```

### Analytics

**GET** `/api/testimonials/analytics` Получить аналитику по отзывам

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

## Описанием принятых архитектурных решений и их обоснованием

- Сделал класс ApiResponse для упрощения работы с типовыми API-ответами.
- Использовал express-validator для облегчения работы с валидацией и большей читаемости.
- Добавил validateSchema middleware для переиспользования кода.
- Добавил централизованный обработчик ошибок для уменьшения повторения кода.
- Добавил класс AppError чтобы не нарушались конвенции для сервисов и удобнее обрабатывались ошибки.
- Использовал Counter для инкремента UserId (в MongoDB нативного автоинкремента нет), т.к. не слишком близко знаком с MongoDB и этот вариант мне показался достаточно прост и быстр в исполнении. При нём отсутствую race conditions, в отличие от чтения максимума из коллеции User.
- Soft delete в целях сохранения истории данных, если понадобится проанализировать сколько отзывов удалил пользователь. Также для обратимости случайных удалений.
- Валидация устроена в два уровня: валидация запроса и валидация в БД. С помощью middleware express-validator обрабатываются неверные запросы (я использовал CheckSchema подход, т.к. он более гибкий и лучше читается, когда много кейсов валидации, чем стандартные validation chains). Валидация в БД ловит всё то, что не словил express-validator, и ошибки корректно интерпретериуются в централизованном обработчике.
- Закрытые edge cases:
    - нельзя расшарить отзыв со статусом ниже completed
    - смена статусов идёт по чёткой цепочке
    - каналы при шеринге объединяются, а не перезаписываются
    - averageRating нормализован к 0, если у всех отзывов пользователя нет рейтинга
    - fail-fast проверка обязательных env variables
    - валидируется поле, по которому сортируеются отзывы

## Обзор

- Время выполнения составило ~44 часа
- Добавил rate limiting
- Добавил unit тесты для auth и обновления статуса
- Добавил integration тесты для CRUD endpoint-ов и аналитики
- Добавил централизованный обработчик ошибок
- Добавил prettier и ESLint для однородного и чистого кода
- Вынес бизнес-логику в сервисы
- Добавил CI workflow

- Использовал бы в следующий раз плагин для автоинкремента ID.
