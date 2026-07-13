// Mentor — Google Drive sync (OAuth via Google Identity Services + Drive appDataFolder)
// Stores one hidden file, mentor-data.json, in the signed-in user's own Drive appDataFolder.
// The user owns the data: it lives in their Drive, not on any server we control.
(function () {
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
  const FILE_NAME = 'mentor-data.json';
  let accessToken = null;
  let tokenClient = null;

  function loadGis() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Falha ao carregar o Google Identity Services'));
      document.head.appendChild(s);
    });
  }

  async function signIn(clientId) {
    await loadGis();
    return new Promise((resolve, reject) => {
      try {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPE,
          callback: (resp) => {
            if (resp.error) { reject(new Error(resp.error)); return; }
            accessToken = resp.access_token;
            resolve(resp);
          },
          error_callback: (err) => { reject(new Error((err && err.type) || 'Falha na autenticação')); },
        });
        tokenClient.requestAccessToken({ prompt: '' });
      } catch (e) { reject(e); }
    });
  }

  function signOut() {
    if (accessToken && window.google && google.accounts && google.accounts.oauth2) {
      try { google.accounts.oauth2.revoke(accessToken, () => {}); } catch (e) {}
    }
    accessToken = null;
  }

  function isSignedIn() { return !!accessToken; }

  async function findFileId() {
    const q = encodeURIComponent("name='" + FILE_NAME + "'");
    const res = await fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=' + q + '&fields=files(id,name)', {
      headers: { Authorization: 'Bearer ' + accessToken },
    });
    if (!res.ok) throw new Error('Falha ao listar arquivos do Drive (' + res.status + ')');
    const data = await res.json();
    return (data.files && data.files[0]) ? data.files[0].id : null;
  }

  async function save(obj) {
    if (!accessToken) throw new Error('Não conectado ao Google Drive');
    const fileId = await findFileId();
    const body = JSON.stringify(obj);
    if (fileId) {
      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
        body,
      });
      if (!res.ok) throw new Error('Falha ao salvar no Drive (' + res.status + ')');
      return fileId;
    }
    const metadata = { name: FILE_NAME, parents: ['appDataFolder'] };
    const boundary = '-------mentor' + Date.now();
    const multipartBody =
      '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) + '\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Type: application/json\r\n\r\n' +
      body + '\r\n' +
      '--' + boundary + '--';
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'multipart/related; boundary=' + boundary },
      body: multipartBody,
    });
    if (!res.ok) throw new Error('Falha ao criar arquivo no Drive (' + res.status + ')');
    const data = await res.json();
    return data.id;
  }

  async function load() {
    if (!accessToken) throw new Error('Não conectado ao Google Drive');
    const fileId = await findFileId();
    if (!fileId) return null;
    const res = await fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media', {
      headers: { Authorization: 'Bearer ' + accessToken },
    });
    if (!res.ok) throw new Error('Falha ao ler o Drive (' + res.status + ')');
    return res.json();
  }

  window.DriveSync = { signIn, signOut, isSignedIn, save, load };
})();
