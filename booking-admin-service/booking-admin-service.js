const express = require('express');
const mysql = require('mysql2/promise');
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
app.use(cors({ origin: '*' }));

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10
});

async function checkConnection() {
  try {
    await pool.getConnection();
    console.log('Connected to MySQL (Admin Service)');
  } catch (error) {
    console.error('MySQL connection error:', error);
    process.exit(1);
  }
}

async function initDatabase() {
  try {
    await pool.query(`
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
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gazebos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        people_amount INT NOT NULL,
        electricity BOOLEAN NOT NULL,
        grill BOOLEAN NOT NULL,
        images JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Houses and Gazebos tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
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

// Получение всех домиков
app.get('/houses', async (req, res) => {
  try {
    const [houses] = await pool.query('SELECT * FROM houses');
    console.log(houses);
    res.json(houses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение дома по ID
app.get('/houses/:id', async (req, res) => {
  try {
    const [houses] = await pool.query('SELECT * FROM houses WHERE id = ?', [req.params.id]);
    if (houses.length === 0) return res.status(404).json({ error: 'Домик не найден' });
    res.json(houses[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создание дома
app.post('/houses', authenticateAdmin, async (req, res) => {
  try {
    const { name, price, people_amount, water_supply, electricity, bathroom, fridge, teapot, microwave_oven, images } = req.body;
    if (!name || !price || !people_amount) return res.status(400).json({ error: 'Имя, цена и количество человек обязательны' });
    const [result] = await pool.query(
      'INSERT INTO houses (name, price, people_amount, water_supply, electricity, bathroom, fridge, teapot, microwave_oven, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, price, people_amount, !!water_supply, !!electricity, !!bathroom, !!fridge, !!teapot, !!microwave_oven, images ? JSON.stringify(images) : null]
    );
    res.status(201).json({ message: 'Дом создан', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновление дома
app.put('/houses/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, price, people_amount, water_supply, electricity, bathroom, fridge, teapot, microwave_oven, images } = req.body;
    if (!name || !price || !people_amount) return res.status(400).json({ error: 'Имя, цена и количество человек обязательны' });
    const [result] = await pool.query(
      'UPDATE houses SET name = ?, price = ?, people_amount = ?, water_supply = ?, electricity = ?, bathroom = ?, fridge = ?, teapot = ?, microwave_oven = ?, images = ? WHERE id = ?',
      [name, price, people_amount, !!water_supply, !!electricity, !!bathroom, !!fridge, !!teapot, !!microwave_oven, images ? JSON.stringify(images) : null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Дом не найден' });
    res.json({ message: 'Дом обновлён' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удаление дома
app.delete('/houses/:id', authenticateAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM houses WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Дом не найден' });
    res.json({ message: 'Дом удалён' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение всех беседок
app.get('/gazebos', async (req, res) => {
  try {
    const [gazebos] = await pool.query('SELECT * FROM gazebos');
    console.log(gazebos);
    res.json(gazebos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение беседки по ID
app.get('/gazebos/:id', async (req, res) => {
  try {
    const [gazebos] = await pool.query('SELECT * FROM gazebos WHERE id = ?', [req.params.id]);
    if (gazebos.length === 0) return res.status(404).json({ error: 'Беседка не найдена' });
    res.json(gazebos[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создание беседки
app.post('/gazebos', authenticateAdmin, async (req, res) => {
  try {
    const { name, price, people_amount, electricity, grill, images } = req.body;
    if (!name || !price || !people_amount) return res.status(400).json({ error: 'Имя, цена и количество человек обязательны' });
    const [result] = await pool.query(
      'INSERT INTO gazebos (name, price, people_amount, electricity, grill, images) VALUES (?, ?, ?, ?, ?, ?)',
      [name, price, people_amount, !!electricity, !!grill, images ? JSON.stringify(images) : null]
    );
    res.status(201).json({ message: 'Беседка создана', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновление беседки
app.put('/gazebos/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, price, people_amount, electricity, grill, images } = req.body;
    if (!name || !price || !people_amount) return res.status(400).json({ error: 'Имя, цена и количество человек обязательны' });
    const [result] = await pool.query(
      'UPDATE gazebos SET name = ?, price = ?, people_amount = ?, electricity = ?, grill = ?, images = ? WHERE id = ?',
      [name, price, people_amount, !!electricity, !!grill, images ? JSON.stringify(images) : null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Беседка не найдена' });
    res.json({ message: 'Беседка обновлена' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удаление беседки
app.delete('/gazebos/:id', authenticateAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM gazebos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Беседка не найдена' });
    res.json({ message: 'Беседка удалена' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

checkConnection().then(() => initDatabase()).then(() => {
  const PORT = 3003;
  app.listen(PORT, () => console.log(`Admin service running on port ${PORT}`));
}).catch(err => console.error('Startup error:', err));