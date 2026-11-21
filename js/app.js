const CATEGORIES = [
  { name: '飲食', emoji: '🍜', bg: '#FEF3C7' },
  { name: '交通', emoji: '🚇', bg: '#DBEAFE' },
  { name: '購物', emoji: '🛍️', bg: '#FCE7F3' },
  { name: '娛樂', emoji: '🎉', bg: '#D1FAE5' },
  { name: '其他', emoji: '🎁', bg: '#EDE9FE' }
];

let selectedCategory = '飲食';

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

  if (id === 'transactions') {
    renderTransactionList();
  }
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
    const card = document.createElement('article');
    card.className = 'tx-card';

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

function resetAddForm() {
  document.getElementById('add-form').reset();
  document.getElementById('date-input').value = todayString();
  document.getElementById('amount-input').value = '';
  setSelectedCategory('飲食');
  showFormError('');
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

  addTransaction({
    amount,
    date,
    merchant,
    category: selectedCategory,
    status: 'confirmed'
  });
  resetAddForm();
  showScreen('transactions');
});

renderCategoryChips();
document.getElementById('date-input').value = todayString();
showScreen('home');
