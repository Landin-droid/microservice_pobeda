const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
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
    console.log('Connected to MySQL (Auth Service)');
  } catch (error) {
    console.error('MySQL connection error:', error);
    process.exit(1);
  }
}

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        surname VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Аутентификация токена
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Токен отсутствует' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Недействительный токен' });
  }
};

// Регистрация
app.post('/register', async (req, res) => {
  try {
    const { name, surname, email, phone, password } = req.body;
    if (!name || !surname || !email || !phone || !password) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, surname, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, surname, email, phone, hashedPassword, 'user']
    );
    res.status(201).json({ message: 'Пользователь зарегистрирован' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Вход
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение профиля
app.get('/profile', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, surname, email, phone, role FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновление профиля
app.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, surname, email, phone } = req.body;
    if (!name || !surname || !email || !phone) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email уже используется' });
    }
    const [result] = await pool.query(
      'UPDATE users SET name = ?, surname = ?, email = ?, phone = ? WHERE id = ?',
      [name, surname, email, phone, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ message: 'Профиль обновлён' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

checkConnection().then(() => initDatabase()).then(() => {
  const PORT = 3001;
  app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`));
}).catch(err => console.error('Startup error:', err));