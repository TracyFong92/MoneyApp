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
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const screen = tab.getAttribute('data-screen');
    showScreen(screen);
  });
});

document.getElementById('fab').addEventListener('click', () => {
  showScreen('add');
});

// 初始畫面
showScreen('home');