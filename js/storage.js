const STORAGE_KEY = 'expense-tracker-transactions';

function readTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('無法讀取消費紀錄', error);
    return [];
  }
}

function writeTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  if (window.cloudSyncEnabled && typeof window.syncTransactionsToCloud === 'function') {
    window.syncTransactionsToCloud(transactions);
  }
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'tx-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

function getTransactions() {
  return readTransactions();
}

function addTransaction(input) {
  const now = new Date();
  const transaction = {
    id: createId(),
    amount: Number(input.amount) || 0,
    date: input.date || now.toISOString().slice(0, 10),
    merchant: (input.merchant || '').trim(),
    category: input.category || '其他',
    status: input.status === 'pending' ? 'pending' : 'confirmed',
    createdAt: now.toISOString()
  };

  const transactions = readTransactions();
  transactions.unshift(transaction);
  writeTransactions(transactions);
  return transaction;
}

function updateTransaction(id, changes) {
  const transactions = readTransactions();
  const index = transactions.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = transactions[index];
  const next = {
    ...current,
    ...changes,
    id: current.id,
    createdAt: current.createdAt
  };

  if (changes.amount !== undefined) next.amount = Number(changes.amount) || 0;
  if (changes.merchant !== undefined) next.merchant = String(changes.merchant).trim();
  if (changes.status !== undefined) {
    next.status = changes.status === 'pending' ? 'pending' : 'confirmed';
  }

  transactions[index] = next;
  writeTransactions(transactions);
  return next;
}

function deleteTransaction(id) {
  const transactions = readTransactions();
  const next = transactions.filter((item) => item.id !== id);
  writeTransactions(next);
  return transactions.length !== next.length;
}

function clearTransactions() {
  writeTransactions([]);
}
