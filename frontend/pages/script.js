// === GLOBAL STATE ===
let editingStudentId = null;
let allStudents = [];
let currentPayments = new Map();
let selectedMonth = new Date().toISOString().slice(0, 7);


// === LOAD STUDENTS AND PAYMENTS ===
async function loadAndRenderStudents() {
  const [studentsRes, paymentsRes] = await Promise.all([
    fetch('http://localhost:3000/students'),
    fetch('http://localhost:3000/payments')
  ]);

  allStudents = await studentsRes.json();
  const payments = await paymentsRes.json();

  const currentMonth = selectedMonth;
  currentPayments = new Map();
  payments.filter(p => p.month === currentMonth).forEach(p => {
    currentPayments.set(p.student_id, p.amount_paid);
  });

  renderStudents();
  if (document.getElementById('total-students')) {
    renderStats(allStudents);
  }
}


// === RENDER STUDENTS WITH FILTERING ===
function renderStudents() {
  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = '';

  const selectedStatus = document.getElementById('statusFilter')?.value || 'all';
  const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';

  allStudents.forEach(student => {
    const paid = currentPayments.get(student.id) || 0;
    const debt = student.price - paid;
    let status = 'not_paid';

    if (paid === student.price) status = 'paid';
    else if (paid > 0) status = 'partial';

    if (selectedStatus !== 'all' && selectedStatus !== status) return;
    if (!student.name.toLowerCase().includes(searchQuery)) return;

    const row = document.createElement('tr');
    row.id = `student-${student.id}`;
    row.innerHTML = `
      <td>${student.name}</td>
      <td>${student.course}</td>
      <td>${student.startDate ? student.startDate.slice(0, 10) : '-'}</td>
      <td>${student.price} сом</td>
      <td>
        <div class="status-box ${status}">
          <select class="status-select ${status}" onchange="handlePaymentStatusChange(${student.id}, this.value, ${student.price})">
            <option value="not_paid" ${status === 'not_paid' ? 'selected' : ''}>Не оплачено</option>
            <option value="paid" ${status === 'paid' ? 'selected' : ''}>Оплачено</option>
            <option value="partial" ${status === 'partial' ? 'selected' : ''}>Частично</option>
          </select>
          ${status === 'partial' ? `<div class="status-info">💸 Оплачено: ${paid} сом<br>❌ Долг: ${debt} сом</div>` : ''}
        </div>
      </td>
      <td>
        <button onclick="editStudent(${student.id})" class="btn btn-edit">Редактировать</button>
        <button onclick="deleteStudent(${student.id})" class="btn btn-delete">Удалить</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}



// === RENDER ONE STUDENT ===
function renderStudent(student, paid = 0) {
  const container = document.getElementById('students');
  const div = document.createElement('div');
  div.className = 'student';
  div.id = `student-${student.id}`;

  let status = 'not_paid';
  let debtInfo = `<span style="color: red;">❌ Не оплачено<br>Долг: ${student.price} сом</span>`;
  const debt = student.price - paid;

  if (paid === student.price) {
    status = 'paid';
    debtInfo = `<span style="color: green;">✅ Оплачено</span>`;
  } else if (paid > 0) {
    status = 'partial';
    debtInfo = `<span style="color: orange;">🟡 Частично: ${paid} сом<br>Долг: ${debt} сом</span>`;
  }

  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start;">
      <div>
        <strong>Имя:</strong> ${student.name}<br>
        <strong>Курс:</strong> ${student.course}<br>
        <strong>Возраст:</strong> ${student.age}<br>
        <strong>Телефон:</strong> ${student.phone}<br>
        <strong>Цена:</strong> ${student.price}<br>
        // <strong>Комментарий:</strong> ${student.comment}<br>
        <div id="debt-${student.id}" style="margin-top: 5px;">${debtInfo}</div>
      </div>
      <div style="text-align: right;">
        <select onchange="handlePaymentStatusChange(${student.id}, this.value, ${student.price})" style="margin-bottom: 5px;">
          <option value="not_paid" ${status === 'not_paid' ? 'selected' : ''}>Не оплачено</option>
          <option value="paid" ${status === 'paid' ? 'selected' : ''}>Оплачено</option>
          <option value="partial" ${status === 'partial' ? 'selected' : ''}>Частично</option>
        </select>
        <button onclick="deleteStudent(${student.id})" class="btn-red">Удалить</button>
        <button onclick="editStudent(${student.id})" class="btn-red">Редактировать</button>
      </div>
    </div>`;

  container.appendChild(div);
}

// === HANDLE PAYMENT STATUS ===
function handlePaymentStatusChange(studentId, status, price) {
  if (status === 'paid') {
    sendPayment(studentId, price, price);
  } else if (status === 'not_paid') {
    sendPayment(studentId, 0, price);
  } else if (status === 'partial') {
    const amount = prompt("Введите сумму оплаты:");
    const paid = parseInt(amount);

    if (isNaN(paid) || paid < 0 || paid > price) {
      alert("Сумма должна быть числом от 0 до " + price);
      return;
    }

    sendPayment(studentId, paid, price);
  }
}



async function sendPayment(studentId, amountPaid, expectedAmount) {
  const month = selectedMonth; // ✅ Используем выбранный месяц
  await fetch('http://localhost:3000/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, month, amount_paid: amountPaid, expected_amount: expectedAmount })
  });
  loadAndRenderStudents();
}

// === DELETION ===
async function deleteStudent(id) {
  if (!confirm('Удалить этого студента?')) return;
  const res = await fetch(`http://localhost:3000/students/${id}`, { method: 'DELETE' });
  if (res.ok) document.getElementById(`student-${id}`).remove();
}

// === EDIT ===
async function editStudent(id) {
  const res = await fetch('http://localhost:3000/students');
  const student = (await res.json()).find(s => s.id === id);

  editingStudentId = id;
  document.getElementById('edit-name').value = student.name;
  document.getElementById('edit-course').value = student.course;
  document.getElementById('edit-age').value = student.age;
  document.getElementById('edit-price').value = student.price;
  document.getElementById('edit-phone').value = student.phone;
  // document.getElementById('edit-comment').value = student.comment;

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
    age: parseInt(document.getElementById('edit-age').value),
    price: parseInt(document.getElementById('edit-price').value),
    phone: document.getElementById('edit-phone').value,
    // comment: document.getElementById('edit-comment').value
  };

  await fetch(`http://localhost:3000/students/${editingStudentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedStudent)
  });

  closeEditModal();
  loadAndRenderStudents();
});

// === STATS ===
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

document.getElementById('monthPicker')?.addEventListener('change', async (e) => {
  selectedMonth = e.target.value;
  await renderPaymentStats(selectedMonth);
  await loadAndRenderStudents(); // Обновляет таблицу студентов
});

async function renderPaymentStats(month) {
  const [paymentsRes, studentsRes] = await Promise.all([
    fetch('http://localhost:3000/payments'),
    fetch('http://localhost:3000/students')
  ]);

  const payments = await paymentsRes.json();
  const students = await studentsRes.json();
  const paymentMap = new Map();

  payments.filter(p => p.month === month).forEach(p => {
    paymentMap.set(p.student_id, p.amount_paid);
  });

  let totalExpected = 0, totalPaid = 0;
  students.forEach(s => {
    totalExpected += s.price;
    totalPaid += paymentMap.get(s.id) || 0;
  });

  const unpaid = totalExpected - totalPaid;

  document.getElementById('statsResult').innerHTML = `
    <p>🧝 Студентов: <strong>${students.length}</strong></p>
    <p>💰 Должны всего: <strong>${totalExpected} сом</strong></p>
    <p>💸 Оплачено: <strong>${totalPaid} сом</strong></p>
    <p>❌ Недоплата: <strong>${unpaid} сом</strong></p>
  `;
}

window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  document.getElementById('monthPicker').value = month;
  renderPaymentStats(month);
  loadAndRenderStudents();

  document.getElementById('searchInput')?.addEventListener('input', renderStudents);
  document.getElementById('statusFilter')?.addEventListener('change', renderStudents);
});


// Открытие и закрытие формы
document.getElementById('openFormBtn').addEventListener('click', () => {
  document.getElementById('studentForm').style.display = 'flex'; // ✅
});

document.getElementById('closeFormBtn').addEventListener('click', () => {
  document.getElementById('studentForm').style.display = 'none'; // ✅
});

// Отправка формы
document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const student = Object.fromEntries(formData.entries());
  student.age = parseInt(student.age);
  student.price = parseInt(student.price);
  student.startDate = document.getElementById('startDate').value;
  const res = await fetch('http://localhost:3000/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student)
  });

  if (res.ok) {
    e.target.reset();
    document.getElementById('studentForm').style.display = 'none';
    loadAndRenderStudents?.(); // перезагрузи таблицу, если функция определена
  } else {
    alert('Ошибка при добавлении студента');
  }
});

flatpickr("#startDate", {
  dateFormat: "Y-m-d",
  altInput: true,
  altFormat: "F j, Y"
});

document.getElementById('downloadExcel').addEventListener('click', () => {
  const selectedStatus = document.getElementById('statusFilter')?.value || 'all';

  const filteredStudents = allStudents.filter(student => {
    const paid = currentPayments.get(student.id) || 0;
    const status =
      paid === student.price ? 'paid' :
      paid > 0 ? 'partial' : 'not_paid';
    return selectedStatus === 'all' || selectedStatus === status;
  });

  const month = document.getElementById('monthPicker').value; // "2025-06"
  const formattedMonth = new Date(month + "-01").toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' });

  // Первая строка и заголовки
  const rows = [
    [`Выгрузка за дату: ${formattedMonth}`],
    ["Имя", "Курс", "Дата начала", "Стоимость", "Оплачено", "Долг", "Статус"]
  ];

  // Данные студентов
  filteredStudents.forEach(student => {
    const paid = currentPayments.get(student.id) || 0;
    const debt = student.price - paid;
    let status = 'Не оплачено';
    if (paid === student.price) status = 'Оплачено';
    else if (paid > 0) status = 'Частично';

    rows.push([
      student.name,
      student.course,
      student.startdate?.slice(0, 10) || '-',
      student.price,
      paid,
      debt,
      status
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Студенты');

  XLSX.writeFile(workbook, `students-${month}.xlsx`);
});



flatpickr("#monthPicker", {
  plugins: [
    new monthSelectPlugin({
      shorthand: true, // Показывает краткие названия месяцев
      dateFormat: "Y-m", // Формат как у <input type="month">
      altFormat: "F Y", // Как будет отображаться
      theme: "dark" // Можно light или dark
    })
  ]
});