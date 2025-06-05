async function loadDashboardStats() {
  try {
    const [studentsRes, paymentsRes] = await Promise.all([
      fetch('http://localhost:3000/students'),
      fetch('http://localhost:3000/payments')
    ]);

    const students = await studentsRes.json();
    const payments = await paymentsRes.json();

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthPayments = payments.filter(p => p.month === currentMonth);

    let totalExpected = 0;
    let totalPaid = 0;

    students.forEach(student => {
      totalExpected += student.price;
      const studentPayment = monthPayments.find(p => p.student_id === student.id);
      const paid = studentPayment?.amount_paid || 0;
      totalPaid += paid;
    });

    const totalProfit = totalPaid;
    const totalExpense = totalExpected - totalPaid;

    // Вставка в HTML
    document.querySelector('.first-banner .banner-money').textContent = `${totalExpected} с`;
    document.querySelector('.second-banner .banner-money').textContent = `${totalExpense} с`;
    document.querySelector('.third-banner .banner-money').textContent = `${totalProfit} с`;

  } catch (error) {
    console.error('Ошибка при загрузке статистики:', error);
  }
}



async function loadStudents() {
  const [studentsRes, paymentsRes] = await Promise.all([
    fetch('http://localhost:3000/students'),
    fetch('http://localhost:3000/payments')
  ]);

  const students = await studentsRes.json();
  const payments = await paymentsRes.json();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = '';

  students.forEach(student => {
    const payment = payments.find(p => p.student_id === student.id && p.month === currentMonth);

    let statusClass = 'shipped';
    let statusLabel = 'Неоплачено';

    if (payment) {
      if (payment.amount_paid === payment.expected_amount) {
        statusClass = 'paid';
        statusLabel = 'Оплачено';
      } else if (payment.amount_paid > 0) {
        statusClass = 'delivered';
        statusLabel = `Частично (${payment.amount_paid} сом)`;
      }
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${student.course}</td>
      <td>${student.start_date || '—'}</td>
      <td>${student.price} сом</td>
      <td><span class="status ${statusClass}">${statusLabel}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
  loadStudents();
});
