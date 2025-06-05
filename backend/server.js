require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.get('/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения данных' });
  }
});

app.post('/students', async (req, res) => {
  const { name, course, age, price, phone, comment } = req.body;

  if (!name || !course || !age || !price || !phone || !comment) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO students (name, course, age, price, phone, comment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, course, age, price, phone, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при добавлении студента' });
  }
});

app.delete('/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при удалении студента' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});


app.put('/students/:id', async (req, res) => {
  const { id } = req.params;
  const { name, course, age, price, phone, comment } = req.body;

  if (!name || !course || !age || !price || !phone || !comment) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const result = await pool.query(
      'UPDATE students SET name = $1, course = $2, age = $3, price = $4, phone = $5, comment = $6 WHERE id = $7 RETURNING *',
      [name, course, age, price, phone, comment, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при обновлении студента' });
  }
});

app.get('/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения оплат' });
  }
});

app.post('/payments', async (req, res) => {
  const { student_id, month, amount_paid, expected_amount } = req.body;

  if (!student_id || !month || expected_amount == null) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    // Проверка: есть ли уже запись за этот месяц и студента
    const existing = await pool.query(
      'SELECT id FROM payments WHERE student_id = $1 AND month = $2',
      [student_id, month]
    );

    if (existing.rows.length > 0) {
      // Обновляем запись
      const updated = await pool.query(
        'UPDATE payments SET amount_paid = $1, expected_amount = $2 WHERE id = $3 RETURNING *',
        [amount_paid, expected_amount, existing.rows[0].id]
      );
      res.json(updated.rows[0]);
    } else {
      // Вставляем новую
      const result = await pool.query(
        'INSERT INTO payments (student_id, month, amount_paid, expected_amount) VALUES ($1, $2, $3, $4) RETURNING *',
        [student_id, month, amount_paid || 0, expected_amount]
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при сохранении оплаты' });
  }
});

