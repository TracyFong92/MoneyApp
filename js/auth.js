import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDw6d6k-0vssQfG3hA0Fih1Imk_K8dwGJE',
  authDomain: 'money-app-35aeb.firebaseapp.com',
  projectId: 'money-app-35aeb',
  storageBucket: 'money-app-35aeb.firebasestorage.app',
  messagingSenderId: '306178173569',
  appId: '1:306178173569:web:d9acf798af8eeb5f89fb80'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginScreen = document.getElementById('login-screen');
const loginForm = document.getElementById('login-form');
const loginNote = document.getElementById('login-note');
const loginError = document.getElementById('login-error');
const loginSubmit = document.getElementById('login-submit');
const loginSwitch = document.getElementById('login-switch');
const appRoot = document.querySelector('.app');

let mode = 'login';

function showError(message) {
  loginError.hidden = !message;
  loginError.textContent = message || '';
}

function setMode(next) {
  mode = next;
  showError('');
  if (mode === 'register') {
    loginNote.textContent = '建立帳號後，這個電郵就能在 Safari 和主畫面 App 使用。';
    loginSubmit.textContent = '建立帳號';
    loginSwitch.textContent = '已有帳號？登入';
    return;
  }
  loginNote.textContent = '用同一個帳號，Safari 和主畫面 App 就能看到同一份資料。';
  loginSubmit.textContent = '登入';
  loginSwitch.textContent = '還沒有帳號？建立帳號';
}

loginSwitch.addEventListener('click', () => {
  setMode(mode === 'login' ? 'register' : 'login');
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showError('');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  loginSubmit.disabled = true;
  try {
    if (mode === 'register') {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    showError(loginMessage(error.code));
  } finally {
    loginSubmit.disabled = false;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  const loggedIn = Boolean(user);
  loginScreen.classList.toggle('is-hidden', loggedIn);
  appRoot.classList.toggle('is-locked', !loggedIn);
});

function loginMessage(code) {
  if (code === 'auth/invalid-email') return '電郵格式不正確';
  if (code === 'auth/email-already-in-use') return '這個電郵已經有帳號，請改用登入';
  if (code === 'auth/weak-password') return '密碼至少要 6 個字';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return '電郵或密碼不正確';
  }
  if (code === 'auth/unauthorized-domain') return '這個網址還沒有加入 Firebase 允許清單';
  return '登入失敗，請再試一次';
}
