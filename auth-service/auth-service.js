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
app.use(cors({ origin: '*' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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
    const {existingUsers} = await pool.query('SELECT id FROM auth.users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const {result} = await pool.query(
      'INSERT INTO auth.users (name, surname, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
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
    const {users} = await pool.query('SELECT * FROM auth.users WHERE email = ?', [email]);
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
    const {users} = await pool.query('SELECT id, name, surname, email, phone, role FROM auth.users WHERE id = ?', [req.user.id]);
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
    const {existingUsers} = await pool.query('SELECT id FROM auth.users WHERE email = ? AND id != ?', [email, req.user.id]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email уже используется' });
    }
    const {result} = await pool.query(
      'UPDATE auth.users SET name = ?, surname = ?, email = ?, phone = ? WHERE id = ?',
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

checkConnection().then(() => {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => console.error('Startup error:', err));