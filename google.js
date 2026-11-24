// Brittech Educação — Conectores Google (google.js)
// Login Google (OAuth 2.0, Google Identity Services) + Google Drive,
// Google Docs e Google Sheets, todos no mesmo login do professor.
//
// COMO FUNCIONA
// - O login usa a biblioteca Google Identity Services (GIS), carregada
//   sob demanda de https://accounts.google.com/gsi/client (fonte:
//   developers.google.com/identity/gsi/web/guides/get-google-api-clientid).
// - O token de acesso fica SÓ na sessão do navegador (sessionStorage) e
//   morre ao fechar a aba/navegador. Nunca vai para arquivo nenhum.
// - O Client ID (OAuth) vem de config.js (googleClientId) ou do campo na
//   aba "Planos e IA" (salvo no localStorage). Sem Client ID, os botões
//   mostram a instrução de como criar um — sem quebrar a página.
// - Sem Client ID configurado, NADA do Google é carregado (nem o script
//   do GIS): a página funciona normalmente, só sem os botões Google.
//
// ESCOPOS (mínimos necessários — ver CONFIG.md para o que cada um faz):
//   drive.file        — criar arquivos no Drive do professor
//   documents         — criar e escrever em Google Docs
//   spreadsheets      — criar e escrever em Google Planilhas
//   openid + email    — mostrar qual conta Google está conectada
//
// LIMITAÇÃO CONHECIDA (OAuth real): o login Google só funciona com o MVP
// servido por HTTPS (ex.: GitHub Pages) e com essa origem cadastrada em
// "Origens JavaScript autorizadas" no Google Cloud Console. Abrindo o
// index.html direto do arquivo (file://), o Google recusa o login — os
// botões mostram a instrução e a página segue funcionando. Ver CONFIG.md.
//
// APIs usadas (REST, com o token no cabeçalho Authorization: Bearer):
//   Docs:   POST https://docs.googleapis.com/v1/documents
//           POST https://docs.googleapis.com/v1/documents/{id}:batchUpdate
//   Sheets: POST https://sheets.googleapis.com/v4/spreadsheets
//           PUT  https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{faixa}
//   Drive:  (criar Docs/Planilhas já cria o arquivo no Drive do professor;
//            o Drive API em si só é usado para abrir o arquivo criado)
//   Conta:  GET  https://www.googleapis.com/oauth2/v3/userinfo
//
// Este arquivo NÃO depende de app.js: só lê window.BRITTECH_CONFIG.
// O agente (agente.js) usa window.__brittechGoogle para salvar os
// documentos e planilhas que gera.

(function () {
  'use strict';

  var GIS_URL = 'https://accounts.google.com/gsi/client';
  var ESCOPOS = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/spreadsheets',
    'openid',
    'email',
  ].join(' ');
  var CHAVE_CLIENT_ID = 'brittech_mvp_google_client_id';
  var CHAVE_TOKEN = 'brittech_mvp_google_token'; // sessionStorage: some ao fechar a aba
  var CHAVE_EMAIL = 'brittech_mvp_google_email';

  var tokenClient = null;      // cliente de token do GIS (criado 1x por Client ID)
  var gisCarregando = null;    // promessa do carregamento do script GIS
  var ouvintes = [];           // callbacks de mudança de estado (UI)

  function $ (id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---------------------------------------------------------- Configuração
  function obterGoogleClientId() {
    var porArquivo = (window.BRITTECH_CONFIG && window.BRITTECH_CONFIG.googleClientId) || '';
    var porNavegador = '';
    try { porNavegador = localStorage.getItem(CHAVE_CLIENT_ID) || ''; } catch (e) { /* sem localStorage */ }
    return (porNavegador || porArquivo || '').trim();
  }
  function configurado() { return !!obterGoogleClientId(); }

  // ---------------------------------------------------------- Token (só na sessão)
  function lerToken() {
    try {
      var raw = sessionStorage.getItem(CHAVE_TOKEN);
      if (!raw) return null;
      var t = JSON.parse(raw);
      if (!t || !t.access_token) return null;
      if (t.expiraEm && Date.now() > t.expiraEm) { limparToken(); return null; }
      return t.access_token;
    } catch (e) { return null; }
  }
  function salvarToken(accessToken, expiresInSeg) {
    try {
      sessionStorage.setItem(CHAVE_TOKEN, JSON.stringify({
        access_token: accessToken,
        expiraEm: Date.now() + Math.max(60, (expiresInSeg || 3600) - 60) * 1000,
      }));
    } catch (e) { /* sessionStorage indisponível: segue sem persistir */ }
  }
  function limparToken() {
    try { sessionStorage.removeItem(CHAVE_TOKEN); } catch (e) { /* nada */ }
    try { sessionStorage.removeItem(CHAVE_EMAIL); } catch (e) { /* nada */ }
  }
  function conectado() { return !!lerToken(); }
  function emailConectado() {
    try { return sessionStorage.getItem(CHAVE_EMAIL) || ''; } catch (e) { return ''; }
  }

  // ---------------------------------------------------------- Biblioteca GIS
  function carregarGIS() {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      return Promise.resolve();
    }
    if (gisCarregando) return gisCarregando;
    gisCarregando = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = GIS_URL;
      s.async = true;
      s.defer = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Não foi possível carregar a biblioteca de login do Google (https://accounts.google.com/gsi/client). Verifique a internet e tente de novo.')); };
      document.head.appendChild(s);
    });
    return gisCarregando;
  }

  // ---------------------------------------------------------- Login / logout
  // Abre o popup de login do Google. Resolve com o e-mail da conta
  // conectada. Rejeita se não houver Client ID, se o GIS não carregar ou
  // se o professor fechar o popup / negar o acesso.
  function conectar() {
    var clientId = obterGoogleClientId();
    if (!clientId) {
      return Promise.reject(new Error('SEM_CLIENT_ID'));
    }
    return carregarGIS().then(function () {
      return new Promise(function (resolve, reject) {
        try {
          if (!tokenClient || tokenClient._clientId !== clientId) {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: ESCOPOS,
              callback: function (resp) {
                if (resp && resp.access_token) {
                  salvarToken(resp.access_token, resp.expires_in);
                  buscarEmail().then(function () {
                    notificar();
                    resolve(emailConectado());
                  }).catch(function () {
                    // E-mail é só exibição: o login vale mesmo sem ele.
                    notificar();
                    resolve('');
                  });
                } else {
                  reject(new Error('O Google não devolveu um token de acesso. Tente de novo.'));
                }
              },
              error_callback: function (err) {
                reject(new Error('Login do Google cancelado ou negado' + (err && err.type ? ' (' + err.type + ')' : '') + '.'));
              },
            });
            tokenClient._clientId = clientId;
          }
          tokenClient.requestAccessToken({ prompt: '' });
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  function desconectar() {
    var token = lerToken();
    limparToken();
    tokenClient = null;
    if (token && window.google && window.google.accounts && window.google.accounts.oauth2) {
      try { window.google.accounts.oauth2.revoke(token, function () { /* revogado */ }); } catch (e) { /* segue desconectado */ }
    }
    notificar();
  }

  // E-mail da conta conectada (só para mostrar "conectado como ...").
  function buscarEmail() {
    var token = lerToken();
    if (!token) return Promise.resolve('');
    return fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + token },
    }).then(function (resp) {
      if (!resp.ok) return '';
      return resp.json();
    }).then(function (json) {
      var email = (json && json.email) || '';
      if (email) {
        try { sessionStorage.setItem(CHAVE_EMAIL, email); } catch (e) { /* nada */ }
      }
      return email;
    }).catch(function () { return ''; });
  }

  // ---------------------------------------------------------- Chamadas às APIs
  function apiFetch(url, opcoes) {
    var token = lerToken();
    if (!token) return Promise.reject(new Error('SEM_LOGIN'));
    var opts = opcoes || {};
    opts.headers = opts.headers || {};
    opts.headers.Authorization = 'Bearer ' + token;
    if (opts.body && typeof opts.body !== 'string') {
      opts.body = JSON.stringify(opts.body);
      opts.headers['Content-Type'] = 'application/json';
    }
    return fetch(url, opts).then(function (resp) {
      if (resp.status === 401) {
        // Token expirado ou revogado: limpa e avisa para conectar de novo.
        limparToken();
        notificar();
        throw new Error('Sessão do Google expirou — conecte de novo na aba “Planos e IA”.');
      }
      return resp.json().then(function (json) {
        if (!resp.ok) {
          var detalhe = (json && json.error && json.error.message) || ('HTTP ' + resp.status);
          throw new Error('Google respondeu: ' + detalhe);
        }
        return json;
      }).catch(function (err) {
        if (err && err.message && err.message.indexOf('Google respondeu') === 0) throw err;
        if (!resp.ok) throw new Error('Google respondeu HTTP ' + resp.status);
        return {};
      });
    });
  }

  // Cria um Google Doc com o texto (um parágrafo por linha) e devolve
  // { id, url } — o arquivo já nasce no Drive do professor.
  function criarGoogleDoc(titulo, texto) {
    if (!conectado()) return Promise.reject(new Error('SEM_LOGIN'));
    return apiFetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      body: { title: titulo || 'Documento — Brittech Educação' },
    }).then(function (doc) {
      var id = doc.documentId;
      if (!id) throw new Error('O Google Docs não devolveu o documento criado.');
      var conteudo = String(texto || '');
      if (!conteudo.trim()) conteudo = '(documento vazio)';
      return apiFetch('https://docs.googleapis.com/v1/documents/' + encodeURIComponent(id) + ':batchUpdate', {
        method: 'POST',
        body: { requests: [{ insertText: { location: { index: 1 }, text: conteudo } }] },
      }).then(function () {
        return { id: id, url: 'https://docs.google.com/document/d/' + id + '/edit' };
      });
    });
  }

  // Cria uma Google Planilha com os dados e devolve { id, url }.
  // dados: { aba?: string, linhas: Array<Array<string|number|{f: string}>> }
  // Célula {f: 'AVERAGE(B2:E2)'} vira fórmula (USER_ENTERED entende '=').
  function criarPlanilha(titulo, dados) {
    if (!conectado()) return Promise.reject(new Error('SEM_LOGIN'));
    var linhas = (dados && dados.linhas) || [];
    var nomeAba = (dados && dados.aba) || 'Planilha';
    var valores = linhas.map(function (linha) {
      return linha.map(function (cel) {
        if (cel && typeof cel === 'object' && typeof cel.f === 'string') return '=' + cel.f;
        return (cel == null ? '' : cel);
      });
    });
    return apiFetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      body: {
        properties: { title: titulo || 'Planilha — Brittech Educação' },
        sheets: [{ properties: { title: nomeAba } }],
      },
    }).then(function (plan) {
      var id = plan.spreadsheetId;
      if (!id) throw new Error('O Google Sheets não devolveu a planilha criada.');
      if (!valores.length) return { id: id, url: 'https://docs.google.com/spreadsheets/d/' + id + '/edit' };
      var faixa = encodeURIComponent(nomeAba) + '!A1';
      return apiFetch('https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(id) + '/values/' + faixa + '?valueInputOption=USER_ENTERED', {
        method: 'PUT',
        body: { range: nomeAba + '!A1', majorDimension: 'ROWS', values: valores },
      }).then(function () {
        return { id: id, url: 'https://docs.google.com/spreadsheets/d/' + id + '/edit' };
      });
    });
  }

  // ---------------------------------------------------------- Interface
  function notificar() {
    atualizarStatusGoogle();
    for (var i = 0; i < ouvintes.length; i++) {
      try { ouvintes[i](getState()); } catch (e) { /* ouvinte com erro: ignora */ }
    }
  }
  function aoMudarEstado(cb) { if (typeof cb === 'function') ouvintes.push(cb); }

  function atualizarStatusGoogle() {
    var estado = getState();
    var texto, classe;
    if (estado.conectado) {
      texto = 'Conectado ao Google' + (estado.email ? ' como ' + estado.email : '') + ' — dá para salvar documentos e planilhas no seu Drive.';
      classe = 'google-ok';
    } else if (!estado.configurado) {
      texto = 'Google não configurado — crie o OAuth Client ID para conectar (instruções abaixo). Sem ele, o agente continua funcionando: os arquivos baixam no seu computador.';
      classe = 'google-off';
    } else {
      texto = 'Google configurado, mas não conectado — clique em “Conectar com o Google” para salvar documentos e planilhas no seu Drive.';
      classe = 'google-off';
    }
    // Status em todos os lugares que mostram o Google (aba Planos e IA
    // e aba Assistente usam o mesmo texto).
    var els = document.querySelectorAll('[data-google-status]');
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = texto;
      els[i].classList.remove('google-ok', 'google-off');
      if (classe) els[i].classList.add(classe);
    }
    var btnsConectar = document.querySelectorAll('[data-google-conectar]');
    for (var j = 0; j < btnsConectar.length; j++) {
      // Sem Client ID o botão fica clicável de propósito: o clique mostra
      // a instrução de como criar o Client ID (não quebra a página).
      btnsConectar[j].disabled = estado.conectado;
      btnsConectar[j].textContent = estado.conectado ? 'Conectado ✓' : 'Conectar com o Google';
    }
    var btnsDesconectar = document.querySelectorAll('[data-google-desconectar]');
    for (var k = 0; k < btnsDesconectar.length; k++) {
      btnsDesconectar[k].hidden = !estado.conectado;
    }
    var instrucao = $('google-instrucao');
    if (instrucao) instrucao.hidden = estado.configurado;
    var campo = $('google-client-id');
    if (campo && !campo.value) campo.value = obterGoogleClientId();
    var campoConectado = $('google-conta');
    if (campoConectado) campoConectado.textContent = estado.conectado ? ('Conta: ' + (estado.email || 'Google conectado')) : '';
  }

  function getState() {
    return {
      configurado: configurado(),
      conectado: conectado(),
      email: emailConectado(),
      clientId: configurado() ? '(configurado)' : '',
      escopos: ESCOPOS.split(' '),
    };
  }

  // Ligação dos botões (os dois lugares: aba Planos e IA e aba Assistente).
  function ligarBotoes() {
    document.querySelectorAll('[data-google-conectar]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!configurado()) {
          var inst = $('google-instrucao');
          if (inst) { inst.hidden = false; inst.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
          return;
        }
        btn.disabled = true;
        btn.textContent = 'Conectando…';
        conectar().then(function () {
          // ok: status atualizado por notificar()
        }).catch(function (err) {
          if (err && err.message === 'SEM_CLIENT_ID') {
            var inst2 = $('google-instrucao');
            if (inst2) inst2.hidden = false;
          } else if (window.__brittech && window.__brittech.avisar) {
            window.__brittech.avisar('Não foi possível conectar ao Google: ' + (err && err.message || err));
          }
        }).finally(function () {
          atualizarStatusGoogle();
        });
      });
    });
    document.querySelectorAll('[data-google-desconectar]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        desconectar();
        atualizarStatusGoogle();
      });
    });
    var btnSalvarId = $('btn-salvar-google-id');
    if (btnSalvarId) {
      btnSalvarId.addEventListener('click', function () {
        var campo = $('google-client-id');
        var v = campo ? campo.value.trim() : '';
        if (!v) {
          try { localStorage.removeItem(CHAVE_CLIENT_ID); } catch (e) { /* nada */ }
        } else {
          try { localStorage.setItem(CHAVE_CLIENT_ID, v); } catch (e) { /* nada */ }
        }
        tokenClient = null; // Client ID mudou: o cliente de token é outro
        atualizarStatusGoogle();
      });
    }
    atualizarStatusGoogle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ligarBotoes);
  } else {
    ligarBotoes();
  }

  // ---------------------------------------------------------- Ganchos p/ o agente e p/ testes
  window.__brittechGoogle = {
    versao: 'google-1.0',
    configurado: configurado,
    conectado: conectado,
    conectar: conectar,
    desconectar: desconectar,
    criarGoogleDoc: criarGoogleDoc,
    criarPlanilha: criarPlanilha,
    obterGoogleClientId: obterGoogleClientId,
    aoMudarEstado: aoMudarEstado,
    atualizarStatusGoogle: atualizarStatusGoogle,
    getState: getState,
    escopos: ESCOPOS.split(' '),
    // Só p/ testes automatizados (simula "Client ID configurado" sem
    // OAuth real — o login de verdade não pode ser testado sem Client ID).
    setClientIdParaTeste: function (id) {
      try {
        if (id) localStorage.setItem(CHAVE_CLIENT_ID, id);
        else localStorage.removeItem(CHAVE_CLIENT_ID);
      } catch (e) { /* nada */ }
      tokenClient = null;
      atualizarStatusGoogle();
    },
  };
})();
