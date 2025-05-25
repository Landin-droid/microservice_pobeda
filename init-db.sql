-- Создание баз данных
CREATE DATABASE IF NOT EXISTS pobeda_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS pobeda_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS pobeda_booking_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Создание таблиц
USE pobeda_auth;
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  surname VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pobeda_booking_admin;
CREATE TABLE IF NOT EXISTS houses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  people_amount INT NOT NULL,
  water_supply BOOLEAN NOT NULL,
  electricity BOOLEAN NOT NULL,
  bathroom BOOLEAN NOT NULL,
  fridge BOOLEAN NOT NULL,
  teapot BOOLEAN NOT NULL,
  microwave_oven BOOLEAN NOT NULL,
  images JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gazebos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  people_amount INT NOT NULL,
  electricity BOOLEAN NOT NULL,
  grill BOOLEAN NOT NULL,
  images JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pobeda_booking;
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('house', 'gazebo') NOT NULL,
  house_id INT NULL,
  gazebo_id INT NULL,
  booking_date DATE NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES pobeda_auth.users(id),
  FOREIGN KEY (house_id) REFERENCES pobeda_booking_admin.houses(id),
  FOREIGN KEY (gazebo_id) REFERENCES pobeda_booking_admin.gazebos(id),
  CONSTRAINT check_item_id CHECK (
    (type = 'house' AND house_id IS NOT NULL AND gazebo_id IS NULL) OR
    (type = 'gazebo' AND gazebo_id IS NOT NULL AND house_id IS NULL)
  )
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO pobeda_auth.users (name, surname, email, phone, password, role)
VALUES ('Админ', 'Админов', 'admin@example.com', '+79134302900', '$2a$10$ZgrKTSmG2T0Stx08c06ypOAE6vDJK.xPZMZIwK0PZpM5hXyHbU6QK', 'admin');

INSERT INTO pobeda_booking_admin.houses 
(name, price, people_amount, water_supply, electricity, bathroom, fridge, teapot, microwave_oven, images)
VALUES 
('Домик №1', 3500.00, 15, TRUE, TRUE, FALSE, TRUE, TRUE, FALSE, '["../images/Живые фото/Домик1-1.jpeg", "../images/Живые фото/Домик1-2.jpeg", "../images/Живые фото/Домик1-3.jpeg", "../images/Живые фото/Домик1-4.jpeg", "../images/Живые фото/Домик1-5.jpeg"]'),
('Домик №2', 3500.00, 15, TRUE, TRUE, FALSE, FALSE, TRUE, FALSE, '["../images/Живые фото/Домик2-1.jpeg", "../images/Живые фото/Домик2-2.jpeg", "../images/Живые фото/Домик2-3.jpeg", "../images/Живые фото/Домик2-4.jpeg", "../images/Живые фото/Домик2-5.jpeg", "../images/Живые фото/Домик2-6.jpeg"]'),
('Домик №3', 4500.00, 15, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, '["../images/Живые фото/Домик3-1.jpeg", "../images/Живые фото/Домик3-2.jpeg", "../images/Живые фото/Домик3-3.jpeg", "../images/Живые фото/Домик3-4.jpeg", "../images/Живые фото/Домик3-5.jpeg", "../images/Живые фото/Домик3-6.jpeg"]'),
('Домик №4', 5000.00, 10, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, '["../images/Живые фото/Домик4-1.jpeg", "../images/Живые фото/Домик4-2.jpeg", "../images/Живые фото/Домик4-3.jpeg", "../images/Живые фото/Домик4-4.jpeg", "../images/Живые фото/Домик4-5.jpeg", "../images/Живые фото/Домик4-6.jpeg", "../images/Живые фото/Домик4-7.jpeg", "../images/Живые фото/Домик4-8.jpeg"]'),
('Домик №6', 2500.00, 10, TRUE, TRUE, FALSE, FALSE, TRUE, FALSE, '["../images/Живые фото/Домик6-1.jpeg", "../images/Живые фото/Домик6-2.jpeg", "../images/Живые фото/Домик6-3.jpeg", "../images/Живые фото/Домик6-4.jpeg", "../images/Живые фото/Домик6-5.jpeg"]'),
('Домик №7', 2500.00, 9, TRUE, TRUE, FALSE, FALSE, TRUE, FALSE, '["../images/Живые фото/Домик7-1.jpeg", "../images/Живые фото/Домик7-2.jpeg", "../images/Живые фото/Домик7-3.jpeg", "../images/Живые фото/Домик7-4.jpeg", "../images/Живые фото/Домик7-5.jpeg", "../images/Живые фото/Домик7-6.jpeg", "../images/Живые фото/Домик7-7.jpeg"]');

INSERT INTO pobeda_booking_admin.gazebos 
(name, price, people_amount, electricity, grill, images)
VALUES 
('Беседка №1', 2000.00, 10, TRUE, TRUE, '["../images/Живые фото/Беседка1-1.jpeg", "../images/Живые фото/Беседка1-2.jpeg", "../images/Живые фото/Беседка1-3.jpeg", "../images/Живые фото/Беседка1-4.jpeg", "../images/Живые фото/Беседка1-5.jpeg"]'),
('Беседка №2', 1500.00, 10, TRUE, TRUE, '["../images/Живые фото/Беседка2-1.jpeg", "../images/Живые фото/Беседка2-2.jpeg", "../images/Живые фото/Беседка2-3.jpeg", "../images/Живые фото/Беседка2-4.jpeg"]'),
('Беседка №3', 1500.00, 15, TRUE, TRUE, '["../images/Живые фото/Беседка3-1.jpeg", "../images/Живые фото/Беседка3-2.jpeg", "../images/Живые фото/Беседка3-3.jpeg"]'),
('Беседка №4', 1000.00, 6, FALSE, TRUE, '["../images/Живые фото/Беседка4-1.jpeg", "../images/Живые фото/Беседка4-2.jpeg", "../images/Живые фото/Беседка4-3.jpeg", "../images/Живые фото/Беседка4-4.jpeg", "../images/Живые фото/Беседка4-5.jpeg"]'),
('Беседка №5', 1000.00, 6, TRUE, TRUE, '["../images/Живые фото/Беседка5-1.jpeg", "../images/Живые фото/Беседка5-2.jpeg", "../images/Живые фото/Беседка5-3.jpeg", "../images/Живые фото/Беседка5-4.jpeg"]'),
('Беседка №6', 1000.00, 10, TRUE, TRUE, '["../images/Живые фото/Беседка6-1.jpeg", "../images/Живые фото/Беседка6-2.jpeg", "../images/Живые фото/Беседка6-3.jpeg", "../images/Живые фото/Беседка6-4.jpeg", "../images/Живые фото/Беседка6-5.jpeg"]'),
('Беседка №7', 2000.00, 15, TRUE, TRUE, '["../images/Живые фото/Беседка7-1.jpeg", "../images/Живые фото/Беседка7-2.jpeg", "../images/Живые фото/Беседка7-3.jpeg", "../images/Живые фото/Беседка7-4.jpeg", "../images/Живые фото/Беседка7-5.jpeg"]');