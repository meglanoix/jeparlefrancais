// firestore-storage.js
// Remplace le SDK Firestore dans les pages admin.
// Ré-exporte tout le SDK Firestore tel quel, MAIS addDoc/updateDoc envoient
// d'abord tout champ contenant un média base64 (data:...) vers Firebase Storage
// et enregistrent l'URL à la place. Aucun changement de logique dans les admins :
// il suffit d'importer depuis ce fichier au lieu de firebase-firestore.js.

export * from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { addDoc as _addDoc, updateDoc as _updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// Storage initialisé à la demande (l'app est prête au moment d'un enregistrement)
let _storage = null;
function storage() { if (!_storage) _storage = getStorage(getApp()); return _storage; }

function dataUriEnBlob(u) {
  const i = u.indexOf(',');
  const mime = (u.slice(5, i).split(';')[0]) || 'application/octet-stream';
  const bin = atob(u.slice(i + 1));
  const arr = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
  const ext = (mime.split('/')[1] || 'bin').split('+')[0];
  return { blob: new Blob([arr], { type: mime }), ext };
}

async function envoyer(dossier, champ, dataUri) {
  const { blob, ext } = dataUriEnBlob(dataUri);
  const nom = dossier + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '_' + champ + '.' + ext;
  const r = ref(storage(), nom);
  await uploadBytes(r, blob);
  return await getDownloadURL(r);
}

// Remplace, dans l'objet à enregistrer, toute valeur "data:..." par une URL Storage.
// Gère les champs simples (image, audio, audio1..5) et les tableaux de médias.
async function convertir(dossier, data) {
  if (!data || typeof data !== 'object') return data;
  const out = Array.isArray(data) ? data.slice() : { ...data };
  for (const cle of Object.keys(out)) {
    const v = out[cle];
    if (typeof v === 'string' && v.startsWith('data:')) {
      out[cle] = await envoyer(dossier, cle, v);
    } else if (Array.isArray(v)) {
      out[cle] = await Promise.all(v.map((el, idx) =>
        (typeof el === 'string' && el.startsWith('data:')) ? envoyer(dossier, cle + idx, el) : el
      ));
    }
  }
  return out;
}

// addDoc(collectionRef, data)
export async function addDoc(colRef, data) {
  const dossier = (colRef && (colRef.id || colRef.path)) || 'divers';
  return _addDoc(colRef, await convertir(dossier, data));
}

// updateDoc(docRef, data) — docRef.path = "collection/docId"
export async function updateDoc(docRef, data) {
  const path = (docRef && docRef.path) || '';
  const dossier = path.split('/')[0] || 'divers';
  return _updateDoc(docRef, await convertir(dossier, data));
}
