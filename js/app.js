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
let categoryManuallyChosen = false;
let formMode = 'add';

const CATEGORY_KEYWORDS = [
  ['飲食', ['麥當勞', 'mcdonald', '肯德基', 'kfc', '星巴克', 'starbucks', '大家樂', '大快活', '美心', '吉野家', '譚仔', '壽司郎', '壽司', '茶餐廳', '咖啡', 'cafe', '餐廳']],
  ['交通', ['八達通', 'octopus', '港鐵', '地鐵', 'mtr', '巴士', '小巴', '的士', 'uber', '電車', '天星', '停車']],
  ['購物', ['無印', 'muji', 'uniqlo', '優衣庫', '百佳', '惠康', '萬寧', '屈臣氏', 'hktvmall', '淘寶', 'taobao', '順豐']],
  ['娛樂', ['電影', '戲院', 'netflix', 'spotify', '遊戲', '卡拉ok', 'ktv']]
];

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

  if (id === 'analytics') {
    renderCategoryBreakdown(document.getElementById('analytics-categories'), 'percent');
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
  renderCategoryBreakdown(document.getElementById('home-categories'), 'amount');
  renderPendingBanner();
}

function monthCategoryTotals() {
  const monthPrefix = todayString().slice(0, 7);
  const totals = {};
  CATEGORIES.forEach((category) => {
    totals[category.name] = 0;
  });

  getTransactions().forEach((transaction) => {
    if (transaction.status === 'pending') return;
    if (!transaction.date || transaction.date.slice(0, 7) !== monthPrefix) return;
    const category = categoryByName(transaction.category);
    totals[category.name] += Math.round((Number(transaction.amount) || 0) * 100);
  });

  return totals;
}

function renderCategoryBreakdown(container, mode) {
  if (!container) return;
  container.replaceChildren();

  const totals = monthCategoryTotals();
  const entries = CATEGORIES
    .map((category) => ({ category, cents: totals[category.name] || 0 }))
    .filter((entry) => entry.cents > 0);
  const total = entries.reduce((sum, entry) => sum + entry.cents, 0);

  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '這個月還沒有可分類的花費。';
    container.appendChild(empty);
    return;
  }

  const barColors = {
    '飲食': '#FDE68A',
    '交通': '#93C5FD',
    '購物': '#F9A8D4',
    '娛樂': '#6EE7B7',
    '其他': '#C4B5FD'
  };

  entries.forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'cat-item';

    const icon = document.createElement('div');
    icon.className = 'cat-icon';
    icon.style.background = entry.category.bg;
    icon.textContent = entry.category.emoji;

    const info = document.createElement('div');
    info.className = 'cat-info';
    const name = document.createElement('div');
    name.className = 'cat-name';
    name.textContent = entry.category.name;
    const bar = document.createElement('div');
    bar.className = 'cat-bar';
    const fill = document.createElement('div');
    fill.className = 'cat-fill';
    const percent = total > 0 ? Math.round((entry.cents / total) * 100) : 0;
    fill.style.width = Math.max(percent, 4) + '%';
    fill.style.background = barColors[entry.category.name] || '#F9A8D4';
    bar.appendChild(fill);
    info.append(name, bar);

    const amount = document.createElement('div');
    amount.className = 'cat-amount';
    amount.textContent = mode === 'percent' ? percent + '%' : formatAmount(entry.cents / 100);

    row.append(icon, info, amount);
    container.appendChild(row);
  });
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
    card.addEventListener('click', () => {
      if (transaction.status === 'pending') openConfirm(transaction.id);
      else openTransaction(transaction.id);
    });

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
    meta.textContent = formatDateLabel(transaction.date) + ' · ' + category.name + (transaction.status === 'pending' ? ' · 待確認' : '');

    const amount = document.createElement('div');
    amount.className = 'tx-amount';
    amount.textContent = formatAmount(transaction.amount);

    info.append(merchant, meta);
    card.append(icon, info, amount);
    list.appendChild(card);
  });
}

function categoryFromMerchant(merchant) {
  const text = String(merchant || '').trim().toLowerCase();
  if (!text) return '';

  const rules = [];
  CATEGORY_KEYWORDS.forEach(([category, words]) => {
    words.forEach((word) => rules.push({ category, word: word.toLowerCase() }));
  });
  rules.sort((a, b) => b.word.length - a.word.length);

  const found = rules.find((rule) => text.includes(rule.word));
  return found ? found.category : '';
}

function updateCategoryHint(message) {
  const hint = document.getElementById('category-hint');
  if (!hint) return;
  if (!message) {
    hint.hidden = true;
    hint.textContent = '';
    return;
  }
  hint.hidden = false;
  hint.textContent = message;
}

function normalizeMerchant(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

function categoryFromHistory(merchant) {
  const text = normalizeMerchant(merchant);
  if (text.length < 2) return '';

  const groups = { exact: {}, partial: {} };
  getTransactions().forEach((transaction) => {
    const name = normalizeMerchant(transaction.merchant);
    if (name.length < 2) return;
    const bucket = name === text ? 'exact' : ((name.includes(text) || text.includes(name)) ? 'partial' : '');
    if (!bucket) return;

    const category = categoryByName(transaction.category).name;
    if (!groups[bucket][category]) groups[bucket][category] = { count: 0, latest: '' };
    groups[bucket][category].count += 1;
    const stamp = String(transaction.createdAt || transaction.date || '');
    if (stamp > groups[bucket][category].latest) groups[bucket][category].latest = stamp;
  });

  const chosen = Object.keys(groups.exact).length ? groups.exact : groups.partial;
  const ranked = Object.keys(chosen).sort((a, b) => {
    if (chosen[a].count !== chosen[b].count) return chosen[b].count - chosen[a].count;
    return chosen[b].latest.localeCompare(chosen[a].latest);
  });
  return ranked[0] || '';
}

function applyMerchantCategory() {
  if (categoryManuallyChosen) return;
  const merchant = document.getElementById('merchant-input').value;
  const habit = categoryFromHistory(merchant);
  if (habit) {
    setSelectedCategory(habit);
    updateCategoryHint('已按你之前的習慣分類為' + habit);
    return;
  }

  const match = categoryFromMerchant(merchant);
  if (!match) {
    updateCategoryHint('');
    return;
  }
  setSelectedCategory(match);
  updateCategoryHint('已按商家自動分類為' + match);
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
  formMode = mode;
  const emoji = document.getElementById('form-emoji');
  const title = document.getElementById('form-title-text');
  const saveBtn = document.getElementById('save-btn');
  const deleteBtn = document.getElementById('delete-btn');
  if (mode === 'edit') {
    emoji.textContent = '✏️';
    title.textContent = '編輯';
    saveBtn.textContent = '儲存修改';
    deleteBtn.hidden = false;
  } else if (mode === 'confirm') {
    emoji.textContent = '✅';
    title.textContent = '確認';
    saveBtn.textContent = '確認這筆';
    deleteBtn.hidden = false;
  } else {
    emoji.textContent = '➕';
    title.textContent = '新增';
    saveBtn.textContent = '儲存這筆';
    deleteBtn.hidden = true;
  }
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
  categoryManuallyChosen = false;
  document.getElementById('add-form').reset();
  document.getElementById('date-input').value = todayString();
  document.getElementById('amount-input').value = '';
  setSelectedCategory('飲食');
  updateCategoryHint('');
  showFormError('');
  setFormMode('add');
}

function pendingTransactions() {
  return getTransactions()
    .filter((item) => item.status === 'pending')
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
}

function renderPendingBanner() {
  const banner = document.getElementById('pending-banner');
  if (!banner) return;
  const count = pendingTransactions().length;
  banner.hidden = count === 0;
  document.getElementById('pending-count').textContent = String(count);
}

function fillTransactionForm(transaction) {
  editingId = transaction.id;
  document.getElementById('amount-input').value = String(transaction.amount);
  document.getElementById('merchant-input').value = transaction.merchant || '';
  document.getElementById('date-input').value = transaction.date || todayString();
  setSelectedCategory(categoryByName(transaction.category).name);
  categoryManuallyChosen = true;
  showFormError('');
}

function openConfirm(id) {
  const pending = pendingTransactions();
  const transaction = pending.find((item) => item.id === id) || pending[0];
  if (!transaction) {
    resetAddForm();
    showScreen('home');
    return;
  }
  fillTransactionForm(transaction);
  setFormMode('confirm');
  updateCategoryHint('還有 ' + pending.length + ' 筆待確認。可以改類別，再按確認。');
  showScreen('add');
}

function openTransaction(id) {
  const transaction = getTransactions().find((item) => item.id === id);
  if (!transaction) return;
  if (transaction.status === 'pending') {
    openConfirm(transaction.id);
    return;
  }
  fillTransactionForm(transaction);
  updateCategoryHint('');
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
    button.addEventListener('click', () => {
      categoryManuallyChosen = true;
      setSelectedCategory(category.name);
      updateCategoryHint('');
    });
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

function setMenuOpen(open) {
  const menu = document.getElementById('side-menu');
  menu.classList.toggle('is-open', open);
  document.querySelector('.menu-panel').style.transform = '';
}

function setBackupSheetOpen(open) {
  document.getElementById('backup-sheet').classList.toggle('is-open', open);
}

document.getElementById('menu-btn').addEventListener('click', () => setMenuOpen(true));
document.getElementById('menu-backdrop').addEventListener('click', () => setMenuOpen(false));
document.getElementById('open-backup').addEventListener('click', () => {
  setMenuOpen(false);
  setBackupSheetOpen(true);
});
document.getElementById('sheet-backdrop').addEventListener('click', () => setBackupSheetOpen(false));

(function setupMenuSwipe() {
  const menu = document.getElementById('side-menu');
  const panel = document.querySelector('.menu-panel');
  const backdrop = document.getElementById('menu-backdrop');
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastTime = 0;
  let velocity = 0;
  let tracking = false;
  let horizontal = false;

  function rubber(distance) {
    const extra = Math.abs(distance);
    return Math.sign(distance) * (1 - Math.exp(-extra / 140)) * 56;
  }

  function place(shown, width) {
    panel.style.transform = 'translateX(' + (shown - width) + 'px)';
    backdrop.style.opacity = String(Math.max(0, Math.min(1, shown / width)));
  }

  document.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    const open = menu.classList.contains('is-open');
    const fromEdge = touch.clientX <= 28;
    const onPanel = open && touch.clientX <= panel.getBoundingClientRect().right + 24;
    if (!fromEdge && !onPanel) return;
    startX = lastX = touch.clientX;
    startY = touch.clientY;
    lastTime = event.timeStamp;
    velocity = 0;
    tracking = true;
    horizontal = false;
  }, { passive: true });

  document.addEventListener('touchmove', (event) => {
    if (!tracking) return;
    const touch = event.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (!horizontal) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        tracking = false;
        return;
      }
      horizontal = true;
      panel.style.transition = 'none';
      backdrop.style.transition = 'none';
    }
    if (event.cancelable) event.preventDefault();
    const width = panel.offsetWidth;
    const open = menu.classList.contains('is-open');
    let shown = (open ? width : 0) + dx;
    if (shown < 0) shown = rubber(shown);
    else if (shown > width) shown = width + rubber(shown - width);
    place(shown, width);
    const dt = event.timeStamp - lastTime;
    if (dt > 0) velocity = (touch.clientX - lastX) / dt;
    lastX = touch.clientX;
    lastTime = event.timeStamp;
  }, { passive: false });

  function endSwipe() {
    if (!tracking) return;
    const wasHorizontal = horizontal;
    tracking = false;
    horizontal = false;
    if (!wasHorizontal) return;

    const width = panel.offsetWidth;
    const matrix = getComputedStyle(panel).transform;
    let shown = 0;
    if (matrix && matrix !== 'none') {
      const values = matrix.match(/-?\d+\.?\d*/g);
      if (values && values.length >= 5) shown = Number(values[4]) + width;
    }
    const open = velocity > 0.45 || (velocity > -0.45 && shown > width * 0.45);
    panel.style.transition = 'transform 0.46s cubic-bezier(0.22, 1.28, 0.36, 1)';
    backdrop.style.transition = 'opacity 0.46s ease';
    void panel.offsetWidth;
    menu.classList.toggle('is-open', open);
    panel.style.transform = '';
    backdrop.style.opacity = '';
  }

  document.addEventListener('touchend', endSwipe);
  document.addEventListener('touchcancel', endSwipe);
})();

document.getElementById('pending-banner').addEventListener('click', () => {
  openConfirm();
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

  if (formMode === 'confirm' && editingId) {
    const updated = updateTransaction(editingId, {
      amount,
      date,
      merchant,
      category: selectedCategory,
      status: 'confirmed'
    });
    if (!updated) {
      showFormError('找不到這筆紀錄，請回到列表再試一次');
      return;
    }
    const next = pendingTransactions()[0];
    if (next) openConfirm(next.id);
    else {
      resetAddForm();
      showScreen('home');
    }
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
    const status = categoryManuallyChosen ? 'confirmed' : 'pending';
    addTransaction({
      amount,
      date,
      merchant,
      category: selectedCategory,
      status
    });
    resetAddForm();
    showScreen(status === 'pending' ? 'home' : 'transactions');
    return;
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
  const wasConfirm = formMode === 'confirm';
  deleteTransaction(editingId);
  if (wasConfirm) {
    const next = pendingTransactions()[0];
    if (next) openConfirm(next.id);
    else {
      resetAddForm();
      showScreen('home');
    }
    return;
  }
  resetAddForm();
  showScreen('transactions');
});

['amount-input', 'merchant-input', 'date-input'].forEach((id) => {
  document.getElementById(id).addEventListener('input', disarmDelete);
});

document.getElementById('merchant-input').addEventListener('input', () => {
  categoryManuallyChosen = false;
  applyMerchantCategory();
});

renderCategoryChips();
document.getElementById('date-input').value = todayString();
setupBackup();
showScreen('home');

let pendingImport = null;

function showBackupMessage(message) {
  const note = document.getElementById('backup-message');
  if (!message) {
    note.hidden = true;
    note.textContent = '';
    return;
  }
  note.hidden = false;
  note.textContent = message;
}

function resetPendingImport() {
  pendingImport = null;
  document.getElementById('import-confirm').hidden = true;
  document.getElementById('choose-backup').hidden = true;
  document.getElementById('import-file').value = '';
}

function normalizeImported(list) {
  if (!Array.isArray(list)) return null;
  const next = [];
  list.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const amount = Number(item.amount);
    const date = String(item.date || '');
    const merchant = String(item.merchant || '').trim();
    if (!Number.isFinite(amount) || amount < 0) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    if (!merchant) return;
    next.push({
      id: item.id ? String(item.id) : createId(),
      amount: Math.round(amount * 100) / 100,
      date,
      merchant,
      category: categoryByName(item.category).name,
      status: item.status === 'pending' ? 'pending' : 'confirmed',
      createdAt: item.createdAt ? String(item.createdAt) : new Date().toISOString()
    });
  });
  return next;
}

function readBackupData(parsed) {
  if (Array.isArray(parsed)) return normalizeImported(parsed);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transactions)) return null;
  return normalizeImported(parsed.transactions);
}

async function exportBackup() {
  const payload = {
    app: 'expense-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions: getTransactions()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const filename = 'expense-backup-' + todayString() + '.json';
  const file = new File([blob], filename, { type: 'application/json' });

  try {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: '支出備份' });
      showBackupMessage('已開啟分享。請儲存到「檔案」或傳給自己。');
      return;
    }
  } catch (error) {
    if (error && error.name === 'AbortError') return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showBackupMessage('已匯出 ' + getTransactions().length + ' 筆。請把檔案存好。');
}

function setupBackup() {
  document.getElementById('export-btn').addEventListener('click', () => {
    resetPendingImport();
    exportBackup();
  });

  document.getElementById('import-btn').addEventListener('click', () => {
    pendingImport = null;
    document.getElementById('import-confirm').hidden = true;
    document.getElementById('import-file').value = '';
    document.getElementById('choose-backup').hidden = false;
    showBackupMessage('請按「選擇備份檔」。');
  });

  document.getElementById('import-file').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    pendingImport = null;
    document.getElementById('import-confirm').hidden = true;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        const transactions = readBackupData(parsed);
        if (!transactions) {
          showBackupMessage('這個檔案不是支出備份，沒有匯入。');
          return;
        }
        pendingImport = transactions;
        document.getElementById('import-confirm').hidden = false;
        showBackupMessage('這個備份有 ' + transactions.length + ' 筆。再按下面的紅色按鈕，才會取代目前資料。');
      } catch (error) {
        showBackupMessage('檔案讀不到，沒有匯入。');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('import-confirm').addEventListener('click', () => {
    if (!pendingImport) return;
    writeTransactions(pendingImport);
    const count = pendingImport.length;
    resetPendingImport();
    renderSummary();
    showBackupMessage('已匯入 ' + count + ' 筆，並取代原本的資料。');
  });
}
