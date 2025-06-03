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
