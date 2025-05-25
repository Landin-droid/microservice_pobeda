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

// Проверка соединения
async function checkConnection() {
  try {
    await pool.getConnection();
    console.log('Connected to MySQL (Booking Service)');
  } catch (error) {
    console.error('MySQL connection error:', error);
    process.exit(1);
  }
}

// Инициализация таблицы bookings
const initDatabase = async () => {
  try {
    await pool.query(`
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
        CHECK ((house_id IS NOT NULL AND gazebo_id IS NULL) OR (house_id IS NULL AND gazebo_id IS NOT NULL))
      )
    `);
    console.log('Bookings table initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

// Аутентификация
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

// Аутентификация админа
const authenticateAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Токен отсутствует' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Требуется роль админа' });
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Недействительный токен' });
  }
};

// Создание брони
app.post('/bookings', authenticate, async (req, res) => {
  try {
    const { type, item_id, booking_date } = req.body;
    if (!type || !item_id || !booking_date) {
      return res.status(400).json({ error: 'Тип, ID объекта и дата обязательны' });
    }
    if (!['house', 'gazebo'].includes(type)) {
      return res.status(400).json({ error: 'Недопустимый тип' });
    }
    const date = new Date(booking_date);
    if (isNaN(date.getTime()) || date < new Date()) {
      return res.status(400).json({ error: 'Недопустимая дата' });
    }
    // Проверка занятой даты
    const [existingBookings] = await pool.query(
      `SELECT id FROM bookings 
       WHERE type = ? AND ${type === 'house' ? 'house_id' : 'gazebo_id'} = ? 
       AND booking_date = ? AND status IN ('pending', 'confirmed')`,
      [type, item_id, booking_date]
    );
    if (existingBookings.length > 0) {
      return res.status(400).json({ error: 'Дата уже забронирована' });
    }
    const [result] = await pool.query(
      `INSERT INTO bookings (user_id, type, ${type === 'house' ? 'house_id' : 'gazebo_id'}, booking_date, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, type, item_id, booking_date, 'pending']
    );
    res.status(201).json({ message: 'Бронирование создано', booking_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение занятых дат
app.get('/bookings/dates', async (req, res) => {
  try {
    const { type, item_id } = req.query;
    if (!type || !item_id) {
      return res.status(400).json({ error: 'Тип и ID объекта обязательны' });
    }
    if (!['house', 'gazebo'].includes(type)) {
      return res.status(400).json({ error: 'Недопустимый тип' });
    }
    const [bookings] = await pool.query(
      `SELECT booking_date FROM bookings 
       WHERE type = ? AND ${type === 'house' ? 'house_id' : 'gazebo_id'} = ? 
       AND status IN ('pending', 'confirmed')`,
      [type, item_id]
    );
    const bookedDates = bookings.map(b => b.booking_date.toISOString().split('T')[0]);
    res.json(bookedDates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение бронирований пользователя
app.get('/bookings', authenticate, async (req, res) => {
  try {
    const [bookings] = await pool.query(
      'SELECT * FROM bookings WHERE user_id = ?',
      [req.user.id]
    );
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение всех бронирований (админ)
app.get('/bookings/all', authenticateAdmin, async (req, res) => {
  try {
    const [bookings] = await pool.query(`
      SELECT b.id, b.user_id, b.type, b.house_id, b.gazebo_id, b.booking_date, b.status, b.created_at, u.email
      FROM bookings b
      JOIN pobeda_auth.users u ON b.user_id = u.id
    `);
    const enrichedBookings = await Promise.all(bookings.map(async booking => {
      const itemId = booking.type === 'house' ? booking.house_id : booking.gazebo_id;
      const endpoint = booking.type === 'house' ? 'houses' : 'gazebos';
      try {
        const response = await fetch(`http://localhost:3003/${endpoint}/${itemId}`);
        const item = await response.json();
        if (!response.ok) throw new Error('Объект не найден');
        return {
          ...booking,
          item_name: item.name,
          item_price: item.price
        };
      } catch (error) {
        return {
          ...booking,
          item_name: 'Неизвестно',
          item_price: 0
        };
      }
    }));
    res.json(enrichedBookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Изменение статуса брони (админ)
app.put('/bookings/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }
    const [result] = await pool.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }
    res.json({ message: 'Статус брони обновлён' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Отмена бронирования
app.delete('/bookings/:id', authenticate, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const [result] = await pool.query(
      'UPDATE bookings SET status = ? WHERE id = ? AND user_id = ? AND status != ?',
      ['cancelled', bookingId, req.user.id, 'cancelled']
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Бронирование не найдено или уже отменено' });
    }
    res.json({ message: 'Бронирование отменено' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

checkConnection().then(() => initDatabase()).then(() => {
  const PORT = 3002;
  app.listen(PORT, () => console.log(`Booking service running on port ${PORT}`));
}).catch(err => console.error('Startup error:', err));