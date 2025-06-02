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
app.use(cors('*'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  client_encoding: 'UTF8'
});

// Проверка соединения
async function checkConnection() {
  try {
    await pool.connect();
    console.log('Connected to PostgreSQL (Booking Service)');
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    process.exit(1);
  }
}

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
    const { rows: existingBookings } = await pool.query(
      `SELECT id FROM booking.bookings 
       WHERE type = $1 AND ${type === 'house' ? 'house_id' : 'gazebo_id'} = $2 
       AND booking_date = $3 AND status IN ('pending', 'confirmed')`,
      [type, item_id, booking_date]
    );
    if (existingBookings.length > 0) {
      return res.status(400).json({ error: 'Дата уже забронирована' });
    }

    // Получение people_amount из соответствующей таблицы
    let people_amount;
    if (type === 'house') {
      const { rows: house } = await pool.query(
        `SELECT people_amount FROM booking_admin.houses WHERE id = $1`,
        [item_id]
      );
      if (house.length === 0) {
        return res.status(400).json({ error: 'Домик не найден' });
      }
      people_amount = house[0].people_amount;
    } else {
      const { rows: gazebo } = await pool.query(
        `SELECT people_amount FROM booking_admin.gazebos WHERE id = $1`,
        [item_id]
      );
      if (gazebo.length === 0) {
        return res.status(400).json({ error: 'Беседка не найдена' });
      }
      people_amount = gazebo[0].people_amount;
    }

    const { rows } = await pool.query(
      `INSERT INTO booking.bookings (user_id, type, ${type === 'house' ? 'house_id' : 'gazebo_id'}, booking_date, status, people_amount) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.user.id, type, item_id, booking_date, 'pending', people_amount]
    );
    res.status(201).json({ message: 'Бронирование создано', booking_id: rows[0].id });
  } catch (error) {
    console.error('Error creating booking:', error.message);
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
    const { rows } = await pool.query(
      `SELECT booking_date FROM booking.bookings 
       WHERE type = $1 AND ${type === 'house' ? 'house_id' : 'gazebo_id'} = $2 
       AND status IN ('pending', 'confirmed')`,
      [type, item_id]
    );
    const bookedDates = rows.map(b => new Date(b.booking_date).toISOString().split('T')[0]);
    res.json(bookedDates);
  } catch (error) {
    console.error('Error fetching booked dates:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Получение бронирований пользователя
app.get('/bookings', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM booking.bookings WHERE user_id = $1',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching user bookings:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Получение всех бронирований (админ)
app.get('/bookings/all', authenticateAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.id, b.user_id, b.type, b.house_id, b.gazebo_id, b.booking_date b.status, b.people_amount, b.created_at, u.email
      FROM booking.bookings b
      JOIN auth.users u ON b.user_id = u.id
    `);
    const enrichedBookings = await Promise.all(rows.map(async booking => {
      const itemId = booking.type === 'house' ? booking.house_id : booking.gazebo_id;
      const endpoint = booking.type === 'house' ? 'houses' : 'gazebos';
      try {
        const response = await fetch(`${process.env.ADMIN_SERVICE_URL}/${endpoint}/${itemId}`);
        if (!response.ok) throw new Error('Объект не найден');
        const item = await response.json();
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
    console.error('Error fetching all bookings:', error.message);
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
    const { rowCount } = await pool.query(
      'UPDATE booking.bookings SET status = $1 WHERE id = $2',
      [status, req.params.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }
    res.json({ message: 'Статус брони обновлён' });
  } catch (error) {
    console.error('Error updating booking status:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Отмена бронирования
app.delete('/bookings/:id', authenticate, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { rowCount } = await pool.query(
      'UPDATE booking.bookings SET status = $1 WHERE id = $2 AND user_id = $3 AND status != $1',
      ['cancelled', bookingId, req.user.id, 'cancelled']
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Бронирование не найдено или уже отменено' });
    }
    res.json({ message: 'Бронирование отменено' });
  } catch (error) {
    console.error('Error cancelling booking:', error.message);
    res.status(500).json({ error: error.message });
  }
});

checkConnection().then(() => {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => console.error('Startup error:', err));