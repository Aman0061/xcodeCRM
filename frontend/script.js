// Обработка формы
document.getElementById('studentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const course = document.getElementById('course').value;
    const comment = document.getElementById('comment').value;
    const age = parseInt(document.getElementById('age').value, 10);
    const price = parseInt(document.getElementById('price').value, 10);
    const phone = parseInt(document.getElementById('phone').value);
    let editingStudentId = null;

    const student = { name, course, age, price, phone, comment };
  
    const res = await fetch('http://localhost:3000/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
  
    if (res.ok) {
      const newStudent = await res.json();
      renderStudent(newStudent);
      document.getElementById('studentForm').reset();
    } else {
      alert('Ошибка добавления');
    }
  });
  
  // Вывод списка студентов
  fetch('http://localhost:3000/students')
  .then(res => res.json())
  .then(data => {
    data.forEach(renderStudent);
    renderStats(data); // 👈 добавили!
  })
    .catch(err => console.error('Ошибка:', err));
  
  // Рендер студента
  function renderStudent(student) {
    const container = document.getElementById('students');
    const div = document.createElement('div');
    div.className = 'student';
    div.id = `student-${student.id}`;
  
    div.innerHTML = `
      <strong>Имя:</strong> ${student.name}<br>
      <strong>Курс:</strong> ${student.course}<br>
      <strong>Возраст:</strong> ${student.age}<br>
      <strong>Телефон:</strong> ${student.phone}<br>
      <strong>Цена:</strong> ${student.price}<br>
      <strong>Comment:</strong> ${student.comment}<br>
      <button onclick="deleteStudent(${student.id})">Удалить</button>
      <button onclick="editStudent(${student.id})">Редактировать</button>
    `;
  
    container.appendChild(div);
  }
  
  // Удаление студента
  async function deleteStudent(id) {
    const confirmed = confirm('Удалить этого студента?');
    if (!confirmed) return;
  
    const res = await fetch(`http://localhost:3000/students/${id}`, {
      method: 'DELETE',
    });
  
    if (res.ok) {
      document.getElementById(`student-${id}`).remove();
    } else {
      alert('Ошибка при удалении');
    }
  }
  
  //редактирование студента
  async function editStudent(id) {
    const res = await fetch('http://localhost:3000/students');
    const data = await res.json();
    const student = data.find(s => s.id === id);
  
    editingStudentId = id;
  
    document.getElementById('edit-name').value = student.name;
    document.getElementById('edit-course').value = student.course;
    document.getElementById('edit-age').value = student.age;
    document.getElementById('edit-price').value = student.price;
    document.getElementById('edit-phone').value = student.phone;
    document.getElementById('edit-comment').value = student.comment;
  
    document.getElementById('editModal').style.display = 'flex';
  }
  function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingStudentId = null;
  }
  document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const updatedStudent = {
      name: document.getElementById('edit-name').value,
      course: document.getElementById('edit-course').value,
      age: parseInt(document.getElementById('edit-age').value, 10),
      price: parseInt(document.getElementById('edit-price').value, 10),
      phone: document.getElementById('edit-phone').value,
      comment: document.getElementById('edit-comment').value,
    };
  
    const res = await fetch(`http://localhost:3000/students/${editingStudentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedStudent),
    });
  
    if (res.ok) {
      closeEditModal();
      location.reload(); // Можно заменить на обновление одного блока
    } else {
      alert('Ошибка при обновлении');
    }
  });

  //статистика
  function renderStats(students) {
    const total = students.length;
    const totalPrice = students.reduce((sum, s) => sum + s.price, 0);
    const avgAge = total ? Math.round(students.reduce((sum, s) => sum + s.age, 0) / total) : 0;
    const avgPrice = total ? Math.round(totalPrice / total) : 0;
  
    document.getElementById('total-students').textContent = total;
    document.getElementById('total-price').textContent = totalPrice;
    document.getElementById('avg-age').textContent = avgAge;
    document.getElementById('avg-price').textContent = avgPrice;
  }
  
  