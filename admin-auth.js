// admin-auth.js — protège les pages admin par connexion Firebase.
// Affiche un écran de connexion par-dessus la page tant que l'utilisateur
// n'est pas authentifié. Une fois connecté, la page admin devient utilisable.
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyCdBoJMNk7brcdc8lGktN0AFbVJ1Dj_r8o",
  authDomain: "audio-francisation.firebaseapp.com",
  projectId: "audio-francisation",
  storageBucket: "audio-francisation.firebasestorage.app",
  messagingSenderId: "840403407027",
  appId: "1:840403407027:web:46b370498fde6374aaa0c6"
};
// réutilise l'app déjà initialisée par la page si elle existe
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- voile de connexion ---
const style = document.createElement('style');
style.textContent = `
#auth-gate { position: fixed; inset: 0; z-index: 99999; background: #f9f5ef; display: flex; align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif; }
#auth-gate .box { background: #fff; border: 1px solid rgba(26,58,92,0.12); border-radius: 16px; padding: 2.25rem 2rem; width: min(92vw, 380px); box-shadow: 0 10px 40px rgba(26,58,92,0.12); }
#auth-gate h2 { font-family: 'Playfair Display', serif; color: #1a3a5c; font-size: 1.5rem; margin: 0 0 0.35rem; }
#auth-gate p { color: #6b6b6b; font-size: 0.88rem; margin: 0 0 1.25rem; }
#auth-gate label { display: block; font-size: 0.78rem; color: #6b6b6b; margin-bottom: 4px; }
#auth-gate input { width: 100%; padding: 10px 12px; border: 1.5px solid rgba(26,58,92,0.15); border-radius: 8px; font-size: 0.92rem; font-family: 'DM Sans', sans-serif; margin-bottom: 0.9rem; }
#auth-gate button { width: 100%; background: #1a3a5c; color: #fff; border: none; border-radius: 9px; padding: 0.85rem; font-size: 0.95rem; font-family: 'DM Sans', sans-serif; cursor: pointer; }
#auth-gate button:hover { opacity: 0.9; }
#auth-gate .err { color: #c0392b; font-size: 0.85rem; min-height: 1.2em; margin-top: 0.5rem; text-align: center; }
#auth-logout { position: fixed; bottom: 14px; right: 14px; z-index: 9998; background: #fff; border: 1.5px solid rgba(26,58,92,0.15); color: #6b6b6b; border-radius: 8px; padding: 7px 12px; font-size: 0.8rem; font-family: 'DM Sans', sans-serif; cursor: pointer; box-shadow: 0 2px 10px rgba(26,58,92,0.1); }
#auth-logout:hover { color: #c0392b; border-color: #c0392b; }
`;
document.head.appendChild(style);

const gate = document.createElement('div');
gate.id = 'auth-gate';
gate.innerHTML = `
  <div class="box">
    <h2>Espace administrateur</h2>
    <p>Connectez-vous pour accéder à cette page.</p>
    <label>Courriel</label>
    <input type="email" id="auth-email" autocomplete="username"/>
    <label>Mot de passe</label>
    <input type="password" id="auth-pass" autocomplete="current-password"/>
    <button id="auth-btn">Se connecter</button>
    <div class="err" id="auth-err"></div>
  </div>`;
document.body.appendChild(gate);

function connecter() {
  const email = document.getElementById('auth-email').value.trim();
  const pass = document.getElementById('auth-pass').value;
  const err = document.getElementById('auth-err');
  err.textContent = '';
  signInWithEmailAndPassword(auth, email, pass).catch(e => {
    err.textContent = 'Courriel ou mot de passe incorrect.';
  });
}
document.getElementById('auth-btn').addEventListener('click', connecter);
document.getElementById('auth-pass').addEventListener('keydown', e => { if (e.key === 'Enter') connecter(); });

onAuthStateChanged(auth, user => {
  if (user) {
    gate.style.display = 'none';
    if (!document.getElementById('auth-logout')) {
      const out = document.createElement('button');
      out.id = 'auth-logout';
      out.textContent = 'Se déconnecter';
      out.addEventListener('click', () => signOut(auth));
      document.body.appendChild(out);
    }
  } else {
    gate.style.display = 'flex';
    const out = document.getElementById('auth-logout');
    if (out) out.remove();
  }
});
