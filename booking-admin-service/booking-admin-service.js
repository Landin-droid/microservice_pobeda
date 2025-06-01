const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  client_encoding: 'UTF8'
});

async function checkConnection() {
  try {
    await pool.connect();
    console.log('Connected to PostgreSQL (Admin Service)');
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    process.exit(1);
  }
}

const authenticateAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Валидация JSON
function isValidJson(data) {
  try {
    JSON.stringify(data); // Проверяем, можно ли сериализовать
    return true;
  } catch {
    return false;
  }
}

// Валидация images
function validateImages(images) {
  if (!images) return false;
  if (!Array.isArray(images)) return false;
  return images.every(img => typeof img === 'string' && img.trim() !== '');
}

// Получение всех домиков
app.get('/houses', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM booking_admin.houses');
    console.log('Houses:', rows);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching houses:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Получение дома по ID
app.get('/houses/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM booking_admin.houses WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Домик не найден' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching house:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Создание дома
app.post('/houses', authenticateAdmin, async (req, res) => {
  try {
    const { name, price, people_amount, water_supply, electricity, bathroom, fridge, teapot, microwave_oven, images } = req.body;
    
    // Валидация
    if (!name || typeof price !== 'number' || !Number.isInteger(people_amount)) {
      return res.status(400).json({ error: 'Имя, цена и количество человек обязательны' });
    }
    if (typeof water_supply !== 'boolean' || typeof electricity !== 'boolean' ||
        typeof bathroom !== 'boolean' || typeof fridge !== 'boolean' ||
        typeof teapot !== 'boolean' || typeof microwave_oven !== 'boolean') {
      return res.status(400).json({ error: 'Некорректные булевы значения для удобств' });
    }
    if (!validateImages(images)) {
      return res.status(400).json({ error: 'Поле images должно быть массивом непустых строк' });
    }
    if (!isValidJson(images)) {
      return res.status(400).json({ error: 'Некорректный JSON в поле images' });
    }

    const { rows } = await pool.query(
      `INSERT INTO booking_admin.houses (name, price, people_amount, water_supply, electricity, bathroom, fridge, teapot, microwave_oven, images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [name, price, people_amount, water_supply, electricity, bathroom, fridge, teapot, microwave_oven, images ? images : null]
    );
    res.status(201).json({ message: 'Дом создан', id: rows[0].id });
  } catch (error) {
    console.error('Error creating house:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Обновление дома
app.put('/houses/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, price, people_amount, images, water_supply, electricity, bathroom, fridge, teapot, microwave_oven } = req.body;
    
    // Валидация
    if (!name || typeof price !== 'number' || !Number.isInteger(people_amount)) {
      return res.status(400).json({ error: 'Имя, цена и количество человек обязательны' });
    }
    if (typeof water_supply !== 'boolean' || typeof electricity !== 'boolean' ||
        typeof bathroom !== 'boolean' || typeof fridge !== 'boolean' ||
        typeof teapot !== 'boolean' || typeof microwave_oven !== 'boolean') {
      return res.status(400).json({ error: 'Некорректные булевы значения для удобств' });
    }
    if (!validateImages(images)) {
      return res.status(400).json({ error: 'Поле images должно быть массивом непустых строк' });
    }
    if (!isValidJson(images)) {
      return res.status(400).json({ error: 'Некорректный JSON в поле images' });
    }

    const imagesJson = JSON.stringify(images);

    const { rows } = await pool.query(
      `UPDATE booking_admin.houses SET name = $1, price = $2, people_amount = $3, images = $4, water_supply = $5, electricity = $6, bathroom = $7, fridge = $8, teapot = $9, microwave_oven = $10 WHERE id = $11 RETURNING *`,
      [name, price, people_amount, imagesJson, water_supply, electricity, bathroom, fridge, teapot, microwave_oven, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Дом не найден' });
    res.json({ message: 'Дом обновлён', house: rows[0] });
  } catch (error) {
    console.error('Error updating house:', error.message);
    res.status(500).json({ error: `Ошибка сервера: ${error.message}` });
  }
});

// Удаление дома
app.delete('/houses/:id', authenticateAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM booking_admin.houses WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Дом не найден' });
    res.json({ message: 'Дом удалён' });
  } catch (error) {
    console.error('Error deleting house:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Получение всех беседок
app.get('/gazebos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM booking_admin.gazebos');
    console.log('Gazebos:', rows); // Исправлено: rows вместо gazebos
    res.json(rows);
  } catch (error) {
    console.error('Error fetching gazebos:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Получение беседки по ID
app.get('/gazebos/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM booking_admin.gazebos WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Беседка не найдена' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching gazebo:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Создание беседки
app.post('/gazebos', authenticateAdmin, async (req, res) => {
  try {
    const { name, price, people_amount, electricity, grill, images } = req.body;
    
    // Валидация
    if (!name || typeof price !== 'number' || !Number.isInteger(people_amount)) {
      return res.status(400).json({ error: 'Имя, цена и количество человек обязательны' });
    }
    if (typeof electricity !== 'boolean' || typeof grill !== 'boolean') {
      return res.status(400).json({ error: 'Некорректные булевы значения для удобств' });
    }
    if (!validateImages(images)) {
      return res.status(400).json({ error: 'Поле images должно быть массивом непустых строк' });
    }
    if (!isValidJson(images)) {
      return res.status(400).json({ error: 'Некорректный JSON в поле images' });
    }

    const { rows } = await pool.query(
      `INSERT INTO booking_admin.gazebos (name, price, people_amount, electricity, grill, images) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, price, people_amount, !!electricity, !!grill, images ? images : null]
    );
    res.status(201).json({ message: 'Беседка создана', id: rows[0].id });
  } catch (error) {
    console.error('Error creating gazebo:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Обновление беседки
app.put('/gazebos/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, price, people_amount, images, electricity, grill } = req.body;

    // Валидация
    if (!name || typeof price !== 'number' || !Number.isInteger(people_amount)) {
      return res.status(400).json({ error: 'Имя, цена и количество человек обязательны' });
    }
    if (typeof electricity !== 'boolean' || typeof grill !== 'boolean') {
      return res.status(400).json({ error: 'Некорректные булевы значения для удобств' });
    }
    if (!validateImages(images)) {
      return res.status(400).json({ error: 'Поле images должно быть массивом непустых строк' });
    }
    if (!isValidJson(images)) {
      return res.status(400).json({ error: 'Некорректный JSON в поле images' });
    }

    const imagesJson = JSON.stringify(images); // Сериализуем в строку JSON

    const { rows } = await pool.query(
      `UPDATE booking_admin.gazebos SET name = $1, price = $2, people_amount = $3, images = $4, electricity = $5, grill = $6 WHERE id = $7 RETURNING *`,
      [name, price, people_amount, imagesJson, electricity, grill, req.params.id]
    );
    if (rows === 0) return res.status(404).json({ error: 'Беседка не найдена' });
    res.json({ message: 'Беседка обновлена' });
  } catch (error) {
    console.error('Error updating gazebo:', error.message);
    res.status(500).json({ error: `Ошибка сервера: ${error.message}` });
  }
});

// Удаление беседки
app.delete('/gazebos/:id', authenticateAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM booking_admin.gazebos WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Беседка не найдена' });
    res.json({ message: 'Беседка удалена' });
  } catch (error) {
    console.error('Error deleting gazebo:', error.message);
    res.status(500).json({ error: error.message });
  }
});

checkConnection().then(() => {
  const PORT = process.env.PORT || 3003;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => console.error('Startup error:', err));