# Лабораторная №5 по дисциплине "Конструирование ПО"
Работа выполнена студентом 3-го курса, группа 8К21, Лямкин Д.С.
Ниже представлена работа микросервисов. P.S. Кириллица не отображается по неизвестным причинам. Будет исправлено.

# Auth-service
Регистрация
curl -X POST http://localhost:3001/register -H "Content-Type: application/json" -d '{
  "name": "Дмитрий",
  "surname": "Лямкин",
  "email": "l@mail.ru",
  "phone": "+79131231212",
  "password": "password123",
  "role": "user"
}'
![image](https://github.com/user-attachments/assets/cac32c4d-208e-41b7-badd-3ca59bc4b261)

Авторизация
curl -X POST http://localhost:3001/login -H "Content-Type: application/json" -d '{
  "email": "l@mail.ru",
  "password": "password123"
}'
![image](https://github.com/user-attachments/assets/b70759c2-806c-4a8b-9d3c-b1550a561f89)

Просмотр профиля
curl -X GET http://localhost:3001/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJsQG1haWwucnUiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0ODE4MzM4NiwiZXhwIjoxNzQ4Nzg4MTg2fQ.r8xnGh_9gGeKYH77LHN3725XZ26mjs5R2QlmUM5KOVo"
![image](https://github.com/user-attachments/assets/82ab3842-17bd-4311-9c53-4302298fede8)

 
# booking-admin-service
Получение домиков
curl -X GET http://localhost:3003/houses

![image](https://github.com/user-attachments/assets/bab04af1-e112-457b-837b-8a7577345bfa)

Получение беседок
curl -X GET http://localhost:3003/gazebos
![image](https://github.com/user-attachments/assets/c77134f1-987e-49ee-810d-91b1072f4ef2)

 
# booking-service
Создать бронирование
curl -X POST http://localhost:3002/bookings -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJwYXZlbEBtYWlsLnJ1Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDgxNzc5MDAsImV4cCI6MTc0ODc4MjcwMH0.izZI6XwnGVuQOj6zWZ2JO7Pkm2jcF128xji0LFxMwpo " -d '{"type": "house", "item_id": 1, "booking_date": "2025-06-01"}'
![image](https://github.com/user-attachments/assets/ee19b51a-1a63-4b24-a11c-8611fdb8a9b5)

Получение бронирований
curl -X GET http://localhost:3002/bookings -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJwYXZlbEBtYWlsLnJ1Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDgxNzc5MDAsImV4cCI6MTc0ODc4MjcwMH0.izZI6XwnGVuQOj6zWZ2JO7Pkm2jcF128xji0LFxMwpo"
 
![image](https://github.com/user-attachments/assets/d46fc8b2-e5e5-4846-84b4-86aaac2c16d3)
