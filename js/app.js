const CATEGORIES = [
  { name: '飲食', emoji: '🍜', bg: '#FEF3C7' },
  { name: '交通', emoji: '🚇', bg: '#DBEAFE' },
  { name: '購物', emoji: '🛍️', bg: '#FCE7F3' },
  { name: '娛樂', emoji: '🎉', bg: '#D1FAE5' },
  { name: '其他', emoji: '🎁', bg: '#EDE9FE' }
];

let selectedCategory = '飲食';
let editingId = null;
let deleteArmed = false;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) screen.classList.add('active');

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`.tab[data-screen="${id}"]`);
  if (tab) tab.classList.add('active');

  const fab = document.getElementById('fab');
  if (fab) {
    fab.style.display = (id === 'add') ? 'none' : 'flex';
  }

  if (id === 'home') {
    renderSummary();
  }

  if (id === 'transactions') {
    renderTransactionList();
  }
}

function dateToString(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return date.getFullYear() + '-' + month + '-' + day;
}

function weekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { start: dateToString(start), end: dateToString(end) };
}

function sumBetween(start, end) {
  return getTransactions().reduce((total, transaction) => {
    if (transaction.status === 'pending') return total;
    if (!transaction.date || transaction.date < start || transaction.date > end) return total;
    return total + Math.round((Number(transaction.amount) || 0) * 100);
  }, 0);
}

function renderSummary() {
  const today = todayString();
  const week = weekRange();
  const monthStart = today.slice(0, 8) + '01';
  const monthEnd = today.slice(0, 8) + '31';

  document.getElementById('today-total').textContent = formatAmount(sumBetween(today, today) / 100);
  document.getElementById('week-total').textContent = formatAmount(sumBetween(week.start, week.end) / 100);
  document.getElementById('month-total').textContent = formatAmount(sumBetween(monthStart, monthEnd) / 100);
}

function categoryByName(name) {
  return CATEGORIES.find((item) => item.name === name) || CATEGORIES[CATEGORIES.length - 1];
}

function formatAmount(value) {
  const number = Number(value) || 0;
  const rounded = Math.round(number * 100) / 100;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return 'HK$ ' + text;
}

function parseAmount(raw) {
  const cleaned = String(raw || '').replace(/[^0-9.]/g, '');
  if (!cleaned || cleaned.split('.').length > 2) return NaN;
  const number = Number(cleaned);
  if (!Number.isFinite(number)) return NaN;
  return Math.round(number * 100) / 100;
}

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return now.getFullYear() + '-' + month + '-' + day;
}

function formatDateLabel(dateString) {
  const today = todayString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.getFullYear()
    + '-' + String(yesterdayDate.getMonth() + 1).padStart(2, '0')
    + '-' + String(yesterdayDate.getDate()).padStart(2, '0');

  if (dateString === today) return '今天';
  if (dateString === yesterday) return '昨天';

  const parts = String(dateString || '').split('-');
  if (parts.length !== 3) return dateString || '';
  return Number(parts[1]) + '月' + Number(parts[2]) + '日';
}

function renderTransactionList() {
  const list = document.getElementById('transaction-list');
  if (!list) return;
  list.replaceChildren();

  const transactions = getTransactions().slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });

  if (transactions.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '還沒有紀錄。按右下角 + 新增第一筆。';
    list.appendChild(empty);
    return;
  }

  let lastDate = '';
  transactions.forEach((transaction) => {
    if (transaction.date !== lastDate) {
      lastDate = transaction.date;
      const group = document.createElement('div');
      group.className = 'date-group';
      group.textContent = formatDateLabel(transaction.date);
      list.appendChild(group);
    }

    const category = categoryByName(transaction.category);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'tx-card';
    card.addEventListener('click', () => openTransaction(transaction.id));

    const icon = document.createElement('div');
    icon.className = 'tx-icon';
    icon.style.background = category.bg;
    icon.textContent = category.emoji;

    const info = document.createElement('div');
    info.className = 'tx-info';

    const merchant = document.createElement('div');
    merchant.className = 'tx-merchant';
    merchant.textContent = transaction.merchant || '未填商家';

    const meta = document.createElement('div');
    meta.className = 'tx-meta';
    meta.textContent = formatDateLabel(transaction.date) + ' · ' + category.name;

    const amount = document.createElement('div');
    amount.className = 'tx-amount';
    amount.textContent = formatAmount(transaction.amount);

    info.append(merchant, meta);
    card.append(icon, info, amount);
    list.appendChild(card);
  });
}

function setSelectedCategory(name) {
  selectedCategory = name;
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.classList.toggle('selected', chip.dataset.category === name);
  });
  disarmDelete();
}

function showFormError(message) {
  const error = document.getElementById('form-error');
  if (!message) {
    error.hidden = true;
    error.textContent = '';
    return;
  }
  error.hidden = false;
  error.textContent = message;
}

function setFormMode(mode) {
  const isEdit = mode === 'edit';
  document.getElementById('form-emoji').textContent = isEdit ? '✏️' : '➕';
  document.getElementById('form-title-text').textContent = isEdit ? '編輯' : '新增';
  document.getElementById('save-btn').textContent = isEdit ? '儲存修改' : '儲存這筆';
  const deleteBtn = document.getElementById('delete-btn');
  deleteBtn.hidden = !isEdit;
  deleteArmed = false;
  deleteBtn.textContent = '刪除這筆';
  deleteBtn.classList.remove('is-armed');
}

function disarmDelete() {
  if (!deleteArmed) return;
  deleteArmed = false;
  const deleteBtn = document.getElementById('delete-btn');
  deleteBtn.textContent = '刪除這筆';
  deleteBtn.classList.remove('is-armed');
}

function resetAddForm() {
  editingId = null;
  document.getElementById('add-form').reset();
  document.getElementById('date-input').value = todayString();
  document.getElementById('amount-input').value = '';
  setSelectedCategory('飲食');
  showFormError('');
  setFormMode('add');
}

function openTransaction(id) {
  const transaction = getTransactions().find((item) => item.id === id);
  if (!transaction) return;

  editingId = transaction.id;
  document.getElementById('amount-input').value = String(transaction.amount);
  document.getElementById('merchant-input').value = transaction.merchant || '';
  document.getElementById('date-input').value = transaction.date || todayString();
  setSelectedCategory(categoryByName(transaction.category).name);
  showFormError('');
  setFormMode('edit');
  showScreen('add');
}

function renderCategoryChips() {
  const wrap = document.getElementById('category-chips');
  CATEGORIES.forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.dataset.category = category.name;
    button.textContent = category.emoji + ' ' + category.name;
    button.addEventListener('click', () => setSelectedCategory(category.name));
    wrap.appendChild(button);
  });
  setSelectedCategory('飲食');
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    showScreen(tab.getAttribute('data-screen'));
  });
});

document.getElementById('fab').addEventListener('click', () => {
  resetAddForm();
  showScreen('add');
});

document.getElementById('add-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const amount = parseAmount(document.getElementById('amount-input').value);
  const merchant = document.getElementById('merchant-input').value.trim();
  const date = document.getElementById('date-input').value;

  if (!Number.isFinite(amount) || amount <= 0) {
    showFormError('請輸入大於 0 的金額');
    return;
  }
  if (!merchant) {
    showFormError('請輸入商家名稱');
    return;
  }
  if (!date) {
    showFormError('請選擇日期');
    return;
  }

  if (editingId) {
    const existing = getTransactions().find((item) => item.id === editingId);
    const updated = updateTransaction(editingId, {
      amount,
      date,
      merchant,
      category: selectedCategory,
      status: existing && existing.status === 'pending' ? 'pending' : 'confirmed'
    });
    if (!updated) {
      showFormError('找不到這筆紀錄，請回到列表再試一次');
      return;
    }
  } else {
    addTransaction({
      amount,
      date,
      merchant,
      category: selectedCategory,
      status: 'confirmed'
    });
  }
  resetAddForm();
  showScreen('transactions');
});

document.getElementById('delete-btn').addEventListener('click', () => {
  if (!editingId) return;
  if (!deleteArmed) {
    deleteArmed = true;
    const deleteBtn = document.getElementById('delete-btn');
    deleteBtn.textContent = '再按一次，確定刪除';
    deleteBtn.classList.add('is-armed');
    return;
  }
  deleteTransaction(editingId);
  resetAddForm();
  showScreen('transactions');
});

['amount-input', 'merchant-input', 'date-input'].forEach((id) => {
  document.getElementById(id).addEventListener('input', disarmDelete);
});

renderCategoryChips();
document.getElementById('date-input').value = todayString();
showScreen('home');
