// Mentor — camada de dados (Firebase Auth + Cloud Firestore).
//
// Interface (a UI só conhece isto, nunca o SDK do Firebase):
//   MentorSync.isConfigured()            -> bool
//   MentorSync.init()                    -> Promise<void>
//   MentorSync.onAuth(cb)                -> cb(user|null)
//   MentorSync.onStatus(cb)              -> cb({state, message})
//   MentorSync.signIn()                  -> Promise<void>
//   MentorSync.signOut()                 -> Promise<void>
//   MentorSync.subscribe(cb)             -> cb(data|null, meta) em tempo real
//   MentorSync.save(data)                -> Promise<void> (debounced pelo chamador)
//
// MODELO DE DADOS
//   users/{uid}/state/mentor  — documento único com { tasks, habits, lists,
//   completedOccurrences, updatedAt (serverTimestamp), device }.
//
//   Por que um documento só? O Mentor já trabalha com esses quatro arrays como um
//   estado coeso (tarefas recorrentes referenciam ocorrências concluídas, hábitos
//   referenciam listas). Um documento mantém a escrita atômica, evita meia
//   sincronização e cabe com folga no limite de 1 MB por documento para uso pessoal.
//
// CONFLITOS
//   Estratégia: last-write-wins por documento, com merge do Firestore e
//   serverTimestamp em updatedAt. Não há resolução manual: o app grava o estado
//   completo a cada alteração e o Firestore entrega a última escrita a todos os
//   dispositivos. Para uso pessoal (mesmo dono em vários aparelhos) isso é
//   suficiente; a janela de perda é apenas a de duas edições simultâneas no mesmo
//   segundo em aparelhos diferentes.
//
// OFFLINE
//   persistentLocalCache + persistentMultipleTabManager: o SDK guarda os dados em
//   IndexedDB, responde de cache quando não há rede e envia as escritas pendentes
//   assim que a conexão volta.
(function () {
  const V = '10.13.2';
  const CDN = 'https://www.gstatic.com/firebasejs/' + V + '/';

  let app = null, auth = null, db = null, fb = {}, user = null;
  let unsubDoc = null, unsubAuth = null;
  let ready = null;
  const authCbs = [], statusCbs = [];
  const deviceId = (() => {
    try {
      let d = localStorage.getItem('mentor_device_id');
      if (!d) { d = Math.random().toString(36).slice(2, 10); localStorage.setItem('mentor_device_id', d); }
      return d;
    } catch (e) { return 'anon'; }
  })();

  function cfg() { return window.MENTOR_FIREBASE_CONFIG || null; }
  function isConfigured() {
    const c = cfg();
    return !!(c && c.apiKey && c.projectId && c.apiKey.indexOf('COLE_AQUI') === -1);
  }

  function emitAuth(u) { user = u; authCbs.forEach(cb => { try { cb(u); } catch (e) {} }); }
  function setStatus(state, message) { statusCbs.forEach(cb => { try { cb({ state, message }); } catch (e) {} }); }

  // Traduz erros do Firebase para mensagens amigáveis (requisito 12).
  function friendly(e) {
    const code = (e && e.code) || '';
    if (code.indexOf('popup-blocked') > -1) return 'O navegador bloqueou a janela de login. Libere pop-ups e tente de novo.';
    if (code.indexOf('popup-closed') > -1 || code.indexOf('cancelled-popup') > -1) return 'Login cancelado.';
    if (code.indexOf('unauthorized-domain') > -1) return 'Este endereço não está autorizado no Firebase. Adicione-o em Authentication → Settings → Authorized domains.';
    if (code.indexOf('network') > -1 || code.indexOf('unavailable') > -1) return 'Sem conexão com o servidor. Suas alterações ficam salvas neste aparelho e sobem quando a internet voltar.';
    if (code.indexOf('permission-denied') > -1) return 'Sem permissão para acessar estes dados. Entre novamente na sua conta.';
    if (code.indexOf('user-token-expired') > -1 || code.indexOf('user-disabled') > -1) return 'Sua sessão expirou. Entre novamente para continuar sincronizando.';
    if (code.indexOf('failed-precondition') > -1) return 'Não foi possível ativar o modo offline (outra aba pode estar aberta).';
    return 'Não foi possível concluir a operação. Tente novamente em instantes.';
  }

  async function init() {
    if (ready) return ready;
    ready = (async () => {
      if (!isConfigured()) throw new Error('unconfigured');
      const [appMod, authMod, fsMod] = await Promise.all([
        import(CDN + 'firebase-app.js'),
        import(CDN + 'firebase-auth.js'),
        import(CDN + 'firebase-firestore.js'),
      ]);
      fb = { ...authMod, ...fsMod };
      app = appMod.initializeApp(cfg());

      try {
        db = fsMod.initializeFirestore(app, {
          localCache: fsMod.persistentLocalCache({ tabManager: fsMod.persistentMultipleTabManager() }),
        });
      } catch (e) {
        // Ex.: navegador em modo privado sem IndexedDB — segue sem cache persistente.
        db = fsMod.getFirestore(app);
        setStatus('warn', 'Modo offline limitado neste navegador.');
      }

      auth = authMod.getAuth(app);
      try { await authMod.setPersistence(auth, authMod.browserLocalPersistence); } catch (e) {}

      unsubAuth = authMod.onAuthStateChanged(auth, u => {
        emitAuth(u ? { uid: u.uid, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '' } : null);
      });

      // Reflete rede na barra de status sem polling.
      window.addEventListener('online', () => setStatus('syncing', 'Reconectando…'));
      window.addEventListener('offline', () => setStatus('offline', 'Offline — salvo neste aparelho'));
    })();
    return ready;
  }

  function onAuth(cb) { authCbs.push(cb); if (user !== undefined) cb(user); return () => { const i = authCbs.indexOf(cb); if (i > -1) authCbs.splice(i, 1); }; }
  function onStatus(cb) { statusCbs.push(cb); return () => { const i = statusCbs.indexOf(cb); if (i > -1) statusCbs.splice(i, 1); }; }

  async function signIn() {
    await init();
    const provider = new fb.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await fb.signInWithPopup(auth, provider);
    } catch (e) {
      const code = (e && e.code) || '';
      // PWA instalado / WebView costuma bloquear popup: cai para redirect.
      if (code.indexOf('popup') > -1 || code.indexOf('operation-not-supported') > -1) {
        try { await fb.signInWithRedirect(auth, provider); return; } catch (e2) { throw new Error(friendly(e2)); }
      }
      throw new Error(friendly(e));
    }
  }

  async function signOut() {
    if (unsubDoc) { unsubDoc(); unsubDoc = null; }
    await init();
    try { await fb.signOut(auth); } catch (e) { throw new Error(friendly(e)); }
  }

  function docRef() {
    if (!user) return null;
    return fb.doc(db, 'users', user.uid, 'state', 'mentor');
  }

  function subscribe(cb) {
    if (unsubDoc) { unsubDoc(); unsubDoc = null; }
    const ref = docRef();
    if (!ref) return () => {};
    setStatus('syncing', 'Sincronizando…');
    unsubDoc = fb.onSnapshot(ref, { includeMetadataChanges: true }, snap => {
      const meta = { fromCache: snap.metadata.fromCache, pending: snap.metadata.hasPendingWrites };
      if (meta.pending) setStatus('syncing', 'Enviando…');
      else if (meta.fromCache) setStatus('offline', 'Offline — salvo neste aparelho');
      else setStatus('ok', 'Sincronizado');
      const d = snap.exists() ? snap.data() : null;
      cb(d ? {
        tasks: d.tasks || [], habits: d.habits || [], lists: d.lists || [],
        completedOccurrences: d.completedOccurrences || [], device: d.device || '',
      } : null, meta);
    }, err => {
      setStatus('error', friendly(err));
    });
    return unsubDoc;
  }

  async function save(data) {
    await init();
    const ref = docRef();
    if (!ref) return;
    // setDoc não espera a rede: com cache persistente a escrita é local e sobe depois.
    try {
      fb.setDoc(ref, {
        tasks: data.tasks || [], habits: data.habits || [], lists: data.lists || [],
        completedOccurrences: data.completedOccurrences || [],
        device: deviceId, updatedAt: fb.serverTimestamp(),
      }, { merge: true }).catch(err => setStatus('error', friendly(err)));
    } catch (e) { setStatus('error', friendly(e)); }
  }

  window.MentorSync = { isConfigured, init, onAuth, onStatus, signIn, signOut, subscribe, save, deviceId };
})();
