const express = require('express');
const { Pool } = require('pg');
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
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  client_encoding: 'UTF8'
});

async function checkConnection() {
  try {
    await pool.connect();
    console.log('Connected to PostgreSQL (Auth Service)');
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    process.exit(1);
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
    const { rows: existingUsers } = await pool.query(
      'SELECT id FROM auth.users WHERE email = $1',
      [email]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO auth.users (name, surname, email, phone, password, role) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, surname, email, phone, hashedPassword, 'user']
    );
    res.status(201).json({ message: 'Пользователь зарегистрирован' });
  } catch (error) {
    console.error('Error registering user:', error.message);
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
    const { rows } = await pool.query(
      'SELECT * FROM auth.users WHERE email = $1',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const user = rows[0]; // Исправлено: rows[0] вместо users[0]
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
    console.error('Error logging in:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Получение профиля
app.get('/profile', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, surname, email, phone, role FROM auth.users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(rows[0]); // Исправлено: rows[0] вместо users[0]
  } catch (error) {
    console.error('Error fetching profile:', error.message);
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
    const { rows: existingUsers } = await pool.query(
      'SELECT id FROM auth.users WHERE email = $1 AND id != $2',
      [email, req.user.id]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email уже используется' });
    }
    const { rowCount } = await pool.query(
      'UPDATE auth.users SET name = $1, surname = $2, email = $3, phone = $4 WHERE id = $5',
      [name, surname, email, phone, req.user.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ message: 'Профиль обновлён' });
  } catch (error) {
    console.error('Error updating profile:', error.message);
    res.status(500).json({ error: error.message });
  }
});

checkConnection().then(() => {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => console.error('Startup error:', err));