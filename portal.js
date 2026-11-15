const dialog = document.getElementById('loginDialog');
const login = document.getElementById('googleLogin');
const status = document.getElementById('loginStatus');
const enter = document.getElementById('enterAdmin');
const destinations = {
  '正職諮詢師｜超額累進制': 'https://ursclinic.github.io/urs-fulltime-commission-admin/',
  '臨時諮詢師｜月等效制': 'https://ursclinic.github.io/monthly-commission-calculator-admin/'
};
let selected = '';
let attempt = 0;
let busy = false;
let sdk;
function clearAccess() { enter.hidden = true; enter.removeAttribute('href'); }
function message(text) { status.textContent = text; }
document.querySelectorAll('[data-admin]').forEach(button => {
  button.addEventListener('click', () => {
    selected = button.dataset.admin;
    document.getElementById('selectedSystem').textContent = selected;
    clearAccess();
    message(sdk ? '請使用已獲授權的 Google 帳號登入。' : '正在準備登入服務…');
    dialog.showModal();
  });
});
document.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { attempt++; clearAccess(); });
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
});
function errorMessage(error) {
  switch (error.code) {
    case 'permission-denied': return '此帳號尚未取得主管權限，請聯絡管理者確認名單，或改用其他 Google 帳號。';
    case 'auth/popup-closed-by-user': return '已取消登入，您可以重新選擇帳號。';
    case 'auth/popup-blocked': return '瀏覽器阻擋了登入視窗，請允許此網站的彈出式視窗後重試。';
    case 'auth/unauthorized-domain': return '此網站網域尚未完成登入設定，請聯絡管理者。';
    default: return '暫時無法完成驗證，請確認網路連線後重試。';
  }
}
login.addEventListener('click', async () => {
  if (!sdk || busy) return;
  busy = true;
  const currentAttempt = ++attempt;
  const target = destinations[selected];
  login.disabled = true;
  clearAccess();
  message('請在 Google 視窗選擇帳號…');
  try {
    // Start the popup directly from the click, before any asynchronous work.
    const result = await sdk.signInWithPopup(sdk.auth, sdk.provider);
    if (currentAttempt !== attempt) return;
    message('正在確認主管權限…');
    const user = result.user;
    if (!user.email || !user.emailVerified) throw { code: 'permission-denied' };
    const record = await sdk.getDocFromServer(sdk.doc(sdk.db, 'admins', user.email));
    if (currentAttempt !== attempt) return;
    if (!record.exists() || record.data().enabled !== true || !target) throw { code: 'permission-denied' };
    enter.href = target;
    enter.hidden = false;
    message(`驗證成功：${user.email}。請點選下方按鈕進入主管版。`);
    login.textContent = '改用其他 Google 帳號';
  } catch (error) {
    if (currentAttempt === attempt) { clearAccess(); message(errorMessage(error)); }
  } finally {
    // Keep no signed-in session on shared clinic computers.
    try { await sdk.signOut(sdk.auth); } catch (_) { /* In-memory persistence ends on page close. */ }
    busy = false;
    login.disabled = false;
  }
});
enter.addEventListener('click', () => { setTimeout(() => dialog.close(), 0); });
async function initializeLogin() {
  try {
    const [appSdk, authSdk, dbSdk] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js')
    ]);
    const app = appSdk.initializeApp({
      apiKey: 'AIzaSyBZs6BaZMovqa216SfsTjvXX6TX-SeND1Q',
      authDomain: 'urs-commission-portal.firebaseapp.com',
      projectId: 'urs-commission-portal',
      storageBucket: 'urs-commission-portal.firebasestorage.app',
      messagingSenderId: '55333216493',
      appId: '1:55333216493:web:61547794c2fe2686b0ace4'
    });
    const auth = authSdk.getAuth(app);
    auth.languageCode = 'zh-TW';
    await authSdk.setPersistence(auth, authSdk.inMemoryPersistence);
    const provider = new authSdk.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    sdk = { ...authSdk, ...dbSdk, auth, provider, db: dbSdk.getFirestore(app) };
    login.disabled = false;
    login.textContent = '使用 Google 帳號登入';
    message('請使用已獲授權的 Google 帳號登入。');
  } catch (_) {
    login.disabled = true;
    login.textContent = '登入服務尚未就緒';
    message('無法載入登入服務，請確認網路後重新整理網頁。員工版與規則文件仍可使用。');
  }
}
initializeLogin();
