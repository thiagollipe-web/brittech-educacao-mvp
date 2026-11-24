// Brittech Educação — MVP do planejador de aulas com IA
// Sem dependências externas. Catálogo BNCC em bncc.js (gerado de bncc.json).
//
// PONTO DE INTEGRAÇÃO COM IA REAL: gerarPlanoComIA(dados) e
// melhorarDocumentoComIA(tipo, texto) abaixo.
// Sem chave configurada, usa os modelos locais (montarPlano / modelos de
// documento) e avisa claramente "modo demonstração, sem IA real".
// Com chave, chama a API do provedor escolhido (ver PROVEDORES).
// Provedores (ver CONFIG.md para os preços e onde criar cada chave):
//   - Gemini: modelo gemini-2.5-flash-lite (API nativa do Google).
//   - DeepSeek: modelo deepseek-chat (API compatível com OpenAI,
//     https://api.deepseek.com/chat/completions).
//   - Maritaca: modelo sabia-4-thinking, modelo de raciocínio da família
//     Sabiá (API compatível com OpenAI,
//     https://chat.maritaca.ai/api/chat/completions).
//     Fonte: documentação oficial da Maritaca, https://docs.maritaca.ai/
//     (página Modelos, consultada em 24/11/2026): nome aceito na API:
//     "sabia-4-thinking"; contexto de até 1M de tokens, saída de até 32K.
//     Preço (página Preços, mesma data): R$ 5,00 / R$ 40,00 por 1M de
//     tokens (entrada / saída) — bem mais caro que o S5 (R$ 0,50 / R$ 2,50).
//     Para voltar ao S5, basta trocar a constante MARITACA_MODEL.
// Como configurar a chave: veja CONFIG.md nesta pasta.
// NUNCA cole uma chave neste arquivo.

// A chave de cada provedor pode vir de config.js (carregado no index.html)
// ou do campo na aba "Planos e IA" (salva no localStorage). Ver CONFIG.md.

var PROVEDORES = {
  gemini:   { id: 'gemini',   nome: 'Gemini',   modelo: 'gemini-2.5-flash-lite', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent', tipo: 'gemini',    chaveExemplo: 'AIza…' },
  deepseek: { id: 'deepseek', nome: 'DeepSeek', modelo: 'deepseek-chat',         endpoint: 'https://api.deepseek.com/chat/completions',                                tipo: 'openai',    chaveExemplo: 'sk-…' },
  maritaca: { id: 'maritaca', nome: 'Maritaca', modelo: 'sabia-4-thinking',   endpoint: 'https://chat.maritaca.ai/api/chat/completions',                           tipo: 'openai',    chaveExemplo: 'chave da Maritaca…' },
};
var GEMINI_MODEL = PROVEDORES.gemini.modelo; // mantido p/ compatibilidade
var GEMINI_ENDPOINT = PROVEDORES.gemini.endpoint;
var DEEPSEEK_MODEL = PROVEDORES.deepseek.modelo;
var MARITACA_MODEL = PROVEDORES.maritaca.modelo;

// Um acesso só, completo: o que muda é só a duração da assinatura.
// Todas as durações têm os mesmos recursos e o mesmo limite de 100 planos/mês.
var PLANOS = {
  mensal:     { nome: 'Mensal', limite: 100, preco: 'R$ 29,90/mês' },
  trimestral: { nome: 'Trimestral', limite: 100, preco: 'R$ 74,90 a cada 3 meses' },
  anual:      { nome: 'Anual', limite: 100, preco: 'R$ 299,00/ano' },
};

var CHAVE_MES = 'brittech_mvp_uso_' + new Date().toISOString().slice(0, 7); // ex.: brittech_mvp_uso_2026-11
var CHAVE_PLANO = 'brittech_mvp_plano';
var CHAVE_PROVEDOR = 'brittech_mvp_provedor';
var CHAVE_PROXY = 'brittech_mvp_proxy_url'; // URL do proxy, se configurada
var CHAVES_IA = { gemini: 'brittech_mvp_gemini_key', deepseek: 'brittech_mvp_deepseek_key', maritaca: 'brittech_mvp_maritaca_key' };

var provedorId = localStorage.getItem(CHAVE_PROVEDOR) || (window.BRITTECH_CONFIG && window.BRITTECH_CONFIG.provedor) || 'deepseek'; // padrão: DeepSeek (o mais barato entre os que liberam uso pago sem burocracia; o Gemini não liberou cota gratuita nas contas do Thiago)
if (!PROVEDORES[provedorId]) provedorId = 'deepseek';

var planoAtual = localStorage.getItem(CHAVE_PLANO) || 'mensal';
if (!PLANOS[planoAtual]) planoAtual = 'mensal'; // planos antigos (Básico/Pro) caem no Mensal
var usados = Number(localStorage.getItem(CHAVE_MES) || 0) || 0;
var ultimoPlano = null;      // dados do último plano gerado (base das documentações)
var britoAtual = 'saudacao';
var DEMO_DELAY_MS = 1200;    // espera simulada p/ o Brito "pensar" (modo demonstração)
var gerando = false;

function salvarUso() { localStorage.setItem(CHAVE_MES, String(usados)); }
function salvarPlano() { localStorage.setItem(CHAVE_PLANO, planoAtual); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function hojeBR() {
  var d = new Date();
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// Mensagem na página (em vez de alert, que trava a página e atrapalha testes).
function avisar(msg) {
  var el = document.getElementById('mensagem');
  el.textContent = msg;
  el.hidden = false;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  clearTimeout(avisar._t);
  avisar._t = setTimeout(function () { el.hidden = true; }, 8000);
}

// ---------------------------------------------------------------- Brito
var BRITO = {
  saudacao:    { img: 'assets/brito-saudacao.svg',    alt: 'Brito, mascote do Brittech Educação, acenando', titulo: 'Oi, eu sou o Brito!', fala: 'Seu ajudante de planejamento. Escolha a etapa, o componente da BNCC e o tema — eu monto o plano de aula para você, do planejamento à prática.' },
  pensando:    { img: 'assets/brito-pensando.svg',    alt: 'Brito pensando enquanto monta o plano', titulo: 'Pensando no seu plano…', fala: 'Só um instante: estou organizando objetivos, atividades e avaliação com a habilidade da BNCC que você escolheu.' },
  comemorando: { img: 'assets/brito-comemorando.svg', alt: 'Brito comemorando o plano pronto', titulo: 'Plano pronto, professor(a)!', fala: 'Já deixei tudo organizado — revise, ajuste o que quiser, imprima ou gere as documentações da turma na próxima aba.' },
};
function setBrito(pose) {
  var b = BRITO[pose] || BRITO.saudacao;
  britoAtual = pose;
  var img = document.getElementById('brito-img');
  img.src = b.img; img.alt = b.alt;
  document.getElementById('brito-titulo').textContent = b.titulo;
  document.getElementById('brito-fala').textContent = b.fala;
}

// ---------------------------------------------------------------- BNCC
function entradas() {
  var out = [];
  for (var i = 0; i < BNCC_DATA.etapas.length; i++) {
    var e = BNCC_DATA.etapas[i];
    if (e.campos_de_experiencia) {
      for (var j = 0; j < e.campos_de_experiencia.length; j++) {
        var c = e.campos_de_experiencia[j];
        out.push({ etapa: e.id, etapaNome: e.nome, tipo: 'Campo de experiência', nome: c.nome, sigla: c.sigla, anos: (e.faixas_etarias || []).map(function (f) { return f.nome + ' (' + f.codigo + ')'; }), habilidades: c.objetivos_exemplo.map(function (h) { return { codigo: h.codigo, descricao: h.descricao, status: h.status, ano: h.codigo.slice(0, 4) }; }) });
      }
    }
    if (e.componentes) {
      for (var k = 0; k < e.componentes.length; k++) {
        var comp = e.componentes[k];
        out.push({ etapa: e.id, etapaNome: e.nome, tipo: 'Componente curricular', nome: comp.nome, sigla: comp.sigla, anos: e.anos || [], habilidades: comp.habilidades_exemplo });
      }
    }
    if (e.areas) {
      for (var m = 0; m < e.areas.length; m++) {
        var a = e.areas[m];
        out.push({ etapa: e.id, etapaNome: e.nome, tipo: 'Área do conhecimento', nome: a.nome, sigla: a.id, anos: e.series || [], componentes: a.componentes, habilidades: a.habilidades_exemplo.map(function (h) { return { codigo: h.codigo, descricao: h.descricao, status: h.status, ano: '1ª a 3ª série' }; }) });
      }
    }
  }
  return out;
}
var ENTRADAS = entradas();

var $ = function (id) { return document.getElementById(id); };
var etapaSel = $('etapa'), compSel = $('componente'), anoSel = $('ano'), habSel = $('habilidade');

function preencher(select, itens, vazio) {
  select.innerHTML = '';
  if (vazio) { var o = document.createElement('option'); o.value = ''; o.textContent = vazio; select.appendChild(o); }
  for (var i = 0; i < itens.length; i++) { var op = document.createElement('option'); op.value = itens[i].value; op.textContent = itens[i].label; select.appendChild(op); }
}
function atualizarComponentes() {
  var lista = ENTRADAS.filter(function (x) { return x.etapa === etapaSel.value; });
  preencher(compSel, lista.map(function (x, i) { return { value: String(i), label: x.nome + ' (' + x.sigla + ')' }; }), 'Escolha o componente / área');
  atualizarAnos();
}
function componenteAtual() {
  var lista = ENTRADAS.filter(function (x) { return x.etapa === etapaSel.value; });
  return lista[Number(compSel.value)];
}
function atualizarAnos() {
  var c = componenteAtual();
  if (!c) { preencher(anoSel, [], 'Escolha o ano / série'); atualizarHabilidades(); return; }
  preencher(anoSel, c.anos.map(function (a) { return { value: a, label: a }; }), 'Escolha o ano / série');
  atualizarHabilidades();
}
function habilidadesFiltradas() {
  var c = componenteAtual();
  if (!c) return [];
  var ano = anoSel.value || '';
  var habs = c.habilidades;
  if (ano) {
    var porAno = habs.filter(function (h) { return (h.ano || '').indexOf(ano.split(' ')[0]) !== -1 || (h.ano || '') === ano; });
    if (porAno.length) habs = porAno;
  }
  var q = ($('filtro-habilidade').value || '').trim().toLowerCase();
  if (q) {
    habs = habs.filter(function (h) { return h.codigo.toLowerCase().indexOf(q) !== -1 || h.descricao.toLowerCase().indexOf(q) !== -1; });
  }
  return habs;
}
function atualizarHabilidades() {
  var c = componenteAtual();
  if (!c) { preencher(habSel, [], 'Escolha a habilidade'); habSel.dataset.lista = '[]'; return; }
  var habs = habilidadesFiltradas();
  preencher(habSel, habs.map(function (h, i) {
    return { value: String(i), label: h.codigo + ' — ' + h.descricao.slice(0, 90) + (h.descricao.length > 90 ? '…' : '') + (h.status === 'a confirmar' ? ' [a confirmar]' : '') };
  }), habs.length ? 'Escolha a habilidade' : 'Nenhuma habilidade para esse filtro — limpe a busca');
  habSel.dataset.lista = JSON.stringify(habs);
  atualizarAvisoHabilidade();
}
function habilidadeAtual() {
  var lista = JSON.parse(habSel.dataset.lista || '[]');
  return lista[Number(habSel.value)];
}
function atualizarAvisoHabilidade() {
  var h = habilidadeAtual();
  var aviso = $('aviso-habilidade');
  if (h && h.status === 'a confirmar') {
    aviso.hidden = false;
    aviso.textContent = 'Atenção: a habilidade ' + h.codigo + ' está marcada como “a confirmar” no catálogo — a descrição segue o padrão da BNCC, mas confira no texto oficial antes de entregar o plano.';
  } else { aviso.hidden = true; aviso.textContent = ''; }
}

// ---------------------------------------------------------------- Modelo local (fallback)
var ATIVIDADES = {
  LP: ['Leitura compartilhada do texto-base', 'Roda de conversa sobre o tema', 'Produção escrita em duplas', 'Socialização das produções com a turma'],
  MA: ['Desafio com material concreto (tampinhas, palitos, material dourado)', 'Resolução de problemas em duplas', 'Jogo de cálculo mental', 'Registro das estratégias no caderno'],
  CI: ['Observação e levantamento de hipóteses', 'Experimento simples com materiais da escola', 'Registro em desenho ou tabela', 'Discussão dos resultados em roda'],
  GE: ['Leitura de mapa ou imagem do lugar', 'Comparação do lugar de vivência com outro lugar', 'Produção de croqui ou mapa simples', 'Apresentação dos mapas'],
  HI: ['Linha do tempo coletiva', 'Análise de imagem ou objeto de época', 'Entrevista com familiar ou morador do bairro', 'Registro no caderno'],
  AR: ['Apreciação de obra ou imagem', 'Experimentação com a técnica proposta', 'Produção artística individual', 'Exposição dos trabalhos na sala'],
  EF: ['Aquecimento e jogo de regras', 'Prática da habilidade motora proposta', 'Variação do jogo em equipes', 'Roda de conversa sobre o jogo'],
  LI: ['Escuta de diálogo curto em inglês', 'Jogo de vocabulário com cartões', 'Produção oral em pares', 'Revisão com música ou chant'],
  ER: ['Roda de conversa sobre o respeito às diferenças', 'Leitura de narrativa', 'Produção de cartaz coletivo', 'Fechamento com partilha'],
  EO: ['Brincadeira livre dirigida', 'Roda de história', 'Atividade de faz de conta', 'Registro com desenho'],
  CG: ['Circuito motor simples', 'Dança ou movimento com música', 'Jogo de imitação', 'Relaxamento e roda final'],
  TS: ['Exploração de sons e materiais', 'Produção com tintas e colagem', 'Brincadeira musical', 'Exposição dos trabalhos'],
  EF2: ['Roda de história e conversa', 'Brincadeira de linguagem', 'Produção de desenho com escrita espontânea', 'Contação para os colegas'],
  ET: ['Exploração de objetos e quantidades', 'Jogo de classificação', 'Brincadeira com medidas e contagem', 'Registro com desenho'],
};
var GENERICO = ['Acolhimento e levantamento do que a turma já sabe', 'Apresentação do tema com exemplo concreto', 'Atividade principal em duplas ou grupos', 'Socialização e fechamento com síntese'];

function atividadesPara(sigla) {
  if (sigla === 'EF' && etapaSel.value === 'educacao-infantil') return ATIVIDADES.EF2;
  return ATIVIDADES[sigla] || GENERICO;
}
function montarPlano(d) {
  var dur = Number(d.duracao);
  var t1 = Math.max(5, Math.round(dur * 0.15));
  var t2 = Math.round(dur * 0.6);
  var t3 = dur - t1 - t2;
  var acts = atividadesPara(d.sigla);
  var obj = d.habilidade.descricao.charAt(0).toLowerCase() + d.habilidade.descricao.slice(1);
  return '' +
  '<p><span class="tag">' + esc(d.etapaNome) + '</span><span class="tag">' + esc(d.componente) + '</span><span class="tag">' + esc(d.ano) + '</span><span class="tag">' + dur + ' minutos</span>' + (d.habilidade.status === 'a confirmar' ? '<span class="tag confirmar">habilidade a confirmar no texto oficial da BNCC</span>' : '') + '</p>' +
  '<h3>' + esc(d.tema) + '</h3>' +
  '<p><strong>Turma:</strong> ' + esc(d.turma || '—') + '</p>' +
  '<h3>1. Objetivos</h3>' +
  '<p>Ao final da aula, os alunos deverão ser capazes de: ' + esc(obj) + '</p>' +
  '<h3>2. Habilidade BNCC</h3>' +
  '<p><code>' + esc(d.habilidade.codigo) + '</code> — ' + esc(d.habilidade.descricao) + '</p>' +
  '<h3>3. Desenvolvimento (' + dur + ' min)</h3>' +
  '<table><tr><th>Momento</th><th>Tempo</th><th>O que fazer</th></tr>' +
  '<tr><td>Acolhimento</td><td>' + t1 + ' min</td><td>' + esc(acts[0]) + '. Levante o que a turma já sabe sobre “' + esc(d.tema) + '”.</td></tr>' +
  '<tr><td>Desenvolvimento</td><td>' + t2 + ' min</td><td>' + esc(acts[1]) + '. Depois, ' + esc(acts[2].charAt(0).toLowerCase() + acts[2].slice(1)) + '.</td></tr>' +
  '<tr><td>Fechamento</td><td>' + t3 + ' min</td><td>' + esc(acts[3]) + '. Retome o objetivo e registre o que a turma aprendeu.</td></tr></table>' +
  '<h3>4. Atividades</h3>' +
  '<ol>' + acts.map(function (a) { return '<li>' + esc(a) + '.</li>'; }).join('') + '</ol>' +
  '<h3>5. Avaliação</h3>' +
  '<p>Observar a participação, recolher a produção dos alunos e registrar quem atingiu a habilidade <code>' + esc(d.habilidade.codigo) + '</code>, quem precisa de apoio e quem pode ir além.</p>' +
  '<h3>6. Recursos</h3>' +
  '<p>Lousa, material impresso, objetos do cotidiano da turma e, se houver, projetor ou celular do professor.</p>' +
  '<h3>7. Adaptações</h3>' +
  '<p>Para quem precisa de apoio: tarefa em dupla com colega-tutor e material concreto. Para quem termina antes: desafio extra sobre o mesmo tema.</p>';
}

// ---------------------------------------------------------------- IA real (Gemini, DeepSeek, Maritaca)
function provedorAtual() { return PROVEDORES[provedorId]; }
function obterChave(id) {
  id = id || provedorId;
  var porArquivo = (window.BRITTECH_CONFIG && window.BRITTECH_CONFIG[id + 'ApiKey']) || '';
  var porNavegador = localStorage.getItem(CHAVES_IA[id]) || '';
  return (porNavegador || porArquivo || '').trim();
}
// URL do proxy da Brittech Educação (ver ../proxy/README.md). Pode vir de
// config.js (proxyUrl) ou do campo na aba "Planos e IA" (localStorage).
function obterProxyUrl() {
  var porArquivo = (window.BRITTECH_CONFIG && window.BRITTECH_CONFIG.proxyUrl) || '';
  var porNavegador = localStorage.getItem(CHAVE_PROXY) || '';
  return (porNavegador || porArquivo || '').trim().replace(/\/+$/, '');
}
// Compatibilidade: código antigo chamava obterChaveGemini().
function obterChaveGemini() { return provedorId === 'gemini' ? obterChave('gemini') : ''; }
// 'proxy' = IA real via proxy (a chave está no servidor, não neste
// navegador); 'ia' = chamada direta com chave local; 'demo' = sem IA real.
function modoIA() {
  if (obterProxyUrl()) return 'proxy';
  return obterChave() ? 'ia' : 'demo';
}

// Chamada única aos 3 provedores. Gemini usa sua API nativa; DeepSeek e
// Maritaca usam o formato compatível com OpenAI (/chat/completions).
// Devolve o texto da resposta. Lança erro se a chamada falhar — quem chama
// decide o fallback (modo demonstração).
async function chamarIA(prompt, sistema) {
  var prov = provedorAtual();
  var mensagens = [
    { role: 'system', content: sistema || 'Você é um assistente de planejamento escolar brasileiro. Responda sempre em português.' },
    { role: 'user', content: prompt },
  ];
  // Modo proxy: o MVP fala só com o proxy da Brittech (ver ../proxy/);
  // a chave fica no servidor e o navegador nunca a vê. Sem proxy, a
  // chamada direta abaixo (que a Maritaca/DeepSeek podem bloquear por CORS).
  var proxyUrl = obterProxyUrl();
  if (proxyUrl) {
    var respP = await fetch(proxyUrl + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: provedorId, messages: mensagens, temperature: 0.7, max_tokens: 3000 }),
    });
    var jsonP = null;
    try { jsonP = await respP.json(); } catch (e) { /* resposta sem JSON */ }
    if (!respP.ok) throw new Error('Proxy respondeu HTTP ' + respP.status + (jsonP && jsonP.erro ? ' — ' + jsonP.erro : ''));
    if (!jsonP || !jsonP.text) throw new Error('O proxy devolveu uma resposta vazia.');
    return jsonP.text;
  }
  var chave = obterChave();
  if (!chave) throw new Error('Sem chave configurada para ' + prov.nome + '.');
  if (prov.tipo === 'gemini') {
    var resp = await fetch(prov.endpoint + '?key=' + encodeURIComponent(chave), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: (sistema ? sistema + '\n\n' : '') + prompt }] }] }),
    });
    if (!resp.ok) throw new Error(prov.nome + ' respondeu HTTP ' + resp.status);
    var json = await resp.json();
    var texto = json && json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts &&
      json.candidates[0].content.parts.map(function (p) { return p.text || ''; }).join('\n');
    if (!texto) throw new Error('Resposta da IA veio vazia.');
    return texto;
  }
  // DeepSeek e Maritaca: formato OpenAI.
  var resp2 = await fetch(prov.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + chave },
    body: JSON.stringify({
      model: prov.modelo,
      messages: mensagens,
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });
  if (!resp2.ok) throw new Error(prov.nome + ' respondeu HTTP ' + resp2.status);
  var json2 = await resp2.json();
  var texto2 = json2 && json2.choices && json2.choices[0] && json2.choices[0].message && json2.choices[0].message.content;
  if (!texto2) throw new Error('Resposta da IA veio vazia.');
  return texto2;
}

var PROMPT_SISTEMA_PLANO = 'Você é um assistente de planejamento escolar brasileiro. Escreva planos de aula completos e práticos, em português, alinhados à BNCC, adequados à realidade da escola pública brasileira. Não invente outra habilidade BNCC além da informada.';

async function gerarPlanoComIA(dados) {
  var prov = provedorAtual();
  if (modoIA() === 'demo') {
    // Sem chave: modelo local + aviso claro de modo demonstração.
    return { html: montarPlano(dados) + '<p><em>Plano gerado em modo demonstração, sem IA real. Para ligar a IA real, escolha um provedor (Gemini, DeepSeek ou Maritaca) e configure sua chave na aba “Planos e IA” — veja CONFIG.md.</em></p>', fonte: 'demo' };
  }
  var prompt = 'Escreva um plano de aula completo e prático, em português, alinhado à BNCC.\n' +
    'Etapa: ' + dados.etapaNome + '\nComponente: ' + dados.componente + '\nAno/série: ' + dados.ano + '\n' +
    'Habilidade BNCC: ' + dados.habilidade.codigo + ' — ' + dados.habilidade.descricao + '\n' +
    'Tema: ' + dados.tema + '\nDuração: ' + dados.duracao + ' minutos\nTurma/observações: ' + (dados.turma || 'não informada') + '\n\n' +
    'Responda em HTML simples, com as seções: 1. Objetivos; 2. Habilidade BNCC; 3. Desenvolvimento com tempos em minutos; 4. Atividades; 5. Avaliação; 6. Recursos; 7. Adaptações. Seja concreto.';
  try {
    var texto = await chamarIA(prompt, PROMPT_SISTEMA_PLANO);
    var html = texto.replace(/```html|```/g, '');
    return { html: '<p><span class="tag">' + esc(dados.etapaNome) + '</span><span class="tag">' + esc(dados.componente) + '</span><span class="tag">' + esc(dados.ano) + '</span><span class="tag">' + esc(dados.duracao) + ' minutos</span></p><h3>' + esc(dados.tema) + '</h3>' + html + '<p><em>Plano escrito pela IA (' + esc(prov.nome) + ' ' + esc(prov.modelo) + '). Revise antes de aplicar.</em></p>', fonte: 'ia' };
  } catch (err) {
    // IA falhou (chave inválida, sem internet, cota, ou o provedor bloqueou
    // chamada direta do navegador): usa o modelo local e avisa.
    return { html: montarPlano(dados) + '<p><em>Não foi possível usar a IA real (' + esc(err.message) + '). Plano gerado em modo demonstração, sem IA real — verifique a chave na aba “Planos e IA” (veja CONFIG.md sobre chamadas diretas do navegador).</em></p>', fonte: 'demo-erro', erro: String(err && err.message || err) };
  }
}

// Reescreve/enriquece um documento com a IA escolhida, mantendo os fatos
// (turma, período, tema, habilidade) do texto original. Sem chave ou com
// erro, devolve null e quem chamou mantém o texto do modelo local.
async function melhorarDocumentoComIA(tipo, textoOriginal) {
  if (modoIA() === 'demo') return null;
  var prov = provedorAtual();
  var nomes = { relatorio: 'relatório de turma', ata: 'ata de reunião', ficha: 'ficha de avaliação', parecer: 'parecer descritivo' };
  var prompt = 'Você é um assistente de documentação escolar brasileiro. Reescreva o ' + (nomes[tipo] || 'documento') + ' abaixo em português claro e profissional, adequado à escola pública brasileira. ' +
    'Mantenha TODOS os fatos (turma, período, datas, tema, componente, habilidade BNCC ' + (ultimoPlano ? ultimoPlano.habilidade.codigo : '') + ') exatamente como estão — não invente nomes, datas, números nem fatos novos. ' +
    'Apenas melhore a redação, a organização e a clareza. Devolva somente o texto do documento, em texto puro (sem HTML, sem markdown).\n\n---\n' + textoOriginal;
  try {
    var texto = await chamarIA(prompt, 'Você é um assistente de documentação escolar brasileiro. Responda sempre em português, em texto puro.');
    return texto.replace(/```/g, '').trim();
  } catch (err) {
    return null; // mantém o texto local; o aviso é mostrado por quem chamou
  }
}

function atualizarModoIA() {
  var el = $('modo-ia'), st = $('status-ia');
  var prov = provedorAtual();
  if (modoIA() === 'proxy') {
    el.classList.add('ia-ativa');
    el.innerHTML = '<strong>IA real ativa via proxy (' + esc(prov.nome) + ' ' + esc(prov.modelo) + ').</strong> Os planos e as documentações serão escritos sob medida pela IA. A chave está só no servidor do proxy — não neste navegador.';
    st.textContent = 'Status da IA: ativa via proxy — ' + prov.nome + ' ' + prov.modelo + ' (proxy: ' + obterProxyUrl() + ').';
  } else if (modoIA() === 'ia') {
    el.classList.add('ia-ativa');
    el.innerHTML = '<strong>IA real ativa (' + esc(prov.nome) + ' ' + esc(prov.modelo) + ').</strong> Os planos e as documentações serão escritos sob medida pela IA. A chave está salva só neste navegador.';
    st.textContent = 'Status da IA: ativa — ' + prov.nome + ' ' + prov.modelo + ' (chave configurada neste navegador).';
  } else {
    el.classList.remove('ia-ativa');
    el.innerHTML = '<strong>Modo demonstração, sem IA real.</strong> Os planos e as documentações são montados a partir de modelos por componente. Para ligar a IA real, escolha um provedor (Gemini, DeepSeek ou Maritaca) e configure sua chave na aba “Planos e IA” — veja o arquivo CONFIG.md.';
    st.textContent = 'Status da IA: modo demonstração, sem IA real (nenhuma chave configurada para ' + prov.nome + ').';
  }
  atualizarStatusProvedores();
}
function atualizarStatusProvedores() {
  var el = $('status-provedores');
  if (!el) return;
  el.innerHTML = Object.keys(PROVEDORES).map(function (id) {
    var p = PROVEDORES[id];
    var tem = obterChave(id) ? 'chave configurada' : 'sem chave';
    return '<li><strong>' + esc(p.nome) + '</strong> (' + esc(p.modelo) + ') — ' + tem + (id === provedorId ? ' <span class="tag">em uso</span>' : '') + '</li>';
  }).join('');
}
// Mostra o campo de chave do provedor selecionado e ajusta rótulo/placeholder.
function atualizarCamposIA() {
  var prov = provedorAtual();
  var rotulo = $('rotulo-chave');
  if (rotulo) rotulo.textContent = 'Chave da API do ' + prov.nome + ' (opcional)';
  var campo = $('chave-ia');
  if (campo) { campo.placeholder = 'Cole aqui a sua chave do ' + prov.nome + ' (' + prov.chaveExemplo + ')'; campo.value = ''; }
  var sel = $('seletor-provedor');
  if (sel) sel.value = provedorId;
  var campoProxy = $('proxy-url');
  if (campoProxy && !campoProxy.value) campoProxy.value = obterProxyUrl();
  var statusProxy = $('status-proxy');
  if (statusProxy) {
    statusProxy.textContent = obterProxyUrl()
      ? 'Proxy configurado: ' + obterProxyUrl() + ' — a chave fica só no servidor e o bloqueio CORS some.'
      : 'Sem proxy configurado — a chamada é direta do navegador (Maritaca e DeepSeek podem bloquear por CORS).';
  }
  var desc = $('descricao-provedor');
  if (desc) {
    var textos = {
      gemini: 'Gemini (Google) — modelo gemini-2.5-flash-lite. Atenção: nas contas do Thiago o nível gratuito não liberou cota (projeto “Brittech Educacao2a” avisa que o nível sem custo não está disponível) — pode ser preciso ativar faturamento no Google.',
      deepseek: 'DeepSeek — modelo deepseek-chat. API paga por uso, bem barata (cerca de R$ 0,01 por plano de aula). É o provedor recomendado para começar.',
      maritaca: 'Maritaca (brasileira, modelo Sabiá 4 Thinking, de raciocínio) — modelo sabia-4-thinking, ótimo em português e em documentos. Preço: R$ 5,00 de entrada e R$ 40,00 de saída por 1 milhão de tokens (cerca de R$ 0,13 por plano — bem mais caro que o S5, que custa R$ 0,50 / R$ 2,50).',
    };
    desc.textContent = textos[provedorId] || '';
  }
  atualizarModoIA();
}

// ---------------------------------------------------------------- Planos e limite
function limiteAtual() { return PLANOS[planoAtual].limite; }
function atualizarContador() {
  var lim = limiteAtual();
  $('plano-nome').textContent = 'Plano: ' + PLANOS[planoAtual].nome;
  $('contador').textContent = usados + ' de ' + lim + ' planos usados neste mês';
  var pct = Math.min(100, Math.round(usados / lim * 100));
  var barra = $('barra-uso-preenchimento');
  barra.style.width = pct + '%';
  barra.classList.toggle('cheia', usados >= lim);
  document.querySelectorAll('.btn-plano').forEach(function (b) { b.classList.toggle('ativo', b.dataset.plano === planoAtual); });
  document.querySelectorAll('.cartao-plano').forEach(function (c) { c.classList.toggle('selecionado', c.dataset.planoCard === planoAtual); });
  var aviso = $('aviso-limite');
  if (usados >= lim) {
    aviso.hidden = false;
    aviso.innerHTML = '<strong>Limite atingido (' + lim + ' planos neste mês).</strong> Todas as durações (Mensal, Trimestral e Anual) têm o mesmo acesso e o mesmo limite de 100 planos por mês. O limite renova no próximo mês.';
  } else { aviso.hidden = true; aviso.textContent = ''; }
}
function trocarPlano(novo) {
  planoAtual = novo; salvarPlano(); atualizarContador();
}

// ---------------------------------------------------------------- Gerar plano (fluxo)
$('form-plano').addEventListener('submit', async function (ev) {
  ev.preventDefault();
  if (gerando) return;
  var c = componenteAtual(), h = habilidadeAtual();
  if (!c || !h) { avisar('Escolha etapa, componente, ano e habilidade.'); return; }
  var lim = limiteAtual();
  if (usados >= lim) {
    atualizarContador();
    avisar('Limite atingido (' + lim + ' planos neste mês). O limite renova no próximo mês — todas as durações têm o mesmo limite de 100 planos por mês.');
    return;
  }
  var dados = { etapaNome: c.etapaNome, etapa: c.etapa, componente: c.nome, sigla: c.sigla, ano: anoSel.value, habilidade: h, tema: $('tema').value.trim(), duracao: $('duracao').value, turma: $('turma').value.trim() };
  gerando = true;
  setBrito('pensando');
  $('secao-resultado').hidden = false;
  $('resultado').innerHTML = '<p>Gerando plano… o Brito está organizando tudo para você.</p>';
  $('secao-resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (modoIA() === 'demo') await sleep(DEMO_DELAY_MS); // espera simulada p/ ver o Brito pensando
  var res = await gerarPlanoComIA(dados);
  $('resultado').innerHTML = res.html;
  ultimoPlano = dados;
  usados++; salvarUso(); atualizarContador();
  setBrito('comemorando');
  gerando = false;
});

// ---------------------------------------------------------------- Documentações
function baseDocs() {
  var p = ultimoPlano;
  return {
    turma: $('doc-turma').value.trim() || p.turma || 'Turma não informada',
    periodo: $('doc-periodo').value.trim() || 'Período não informado',
    data: $('doc-data').value.trim() || hojeBR(),
    professor: $('doc-professor').value.trim() || 'Professor(a)',
    tema: p.tema, etapa: p.etapaNome, componente: p.componente, ano: p.ano,
    habilidade: p.habilidade.codigo + ' — ' + p.habilidade.descricao,
    codigo: p.habilidade.codigo, duracao: p.duracao,
    confirmar: p.habilidade.status === 'a confirmar',
  };
}
function gerarRelatorio(b) {
  return 'RELATÓRIO DE TURMA\n' +
    'Turma: ' + b.turma + ' | Período: ' + b.periodo + ' | Data: ' + b.data + '\nProfessor(a): ' + b.professor + '\n\n' +
    '1. O que foi trabalhado\n' +
    'No período, a turma trabalhou o tema "' + b.tema + '" (' + b.componente + ', ' + b.ano + ', ' + b.etapa + '), ' +
    'com duração prevista de ' + b.duracao + ' minutos, alinhado à habilidade BNCC ' + b.habilidade + '.\n\n' +
    '2. Como a turma respondeu\n' +
    'A turma participou das atividades propostas (acolhimento, desenvolvimento e fechamento), com produção registrada em aula. ' +
    'Os alunos demonstraram interesse pelo tema e conseguiram relacionar o conteúdo com situações do cotidiano.\n\n' +
    '3. Avanços observados\n' +
    '- Maior parte da turma avançou na habilidade ' + b.codigo + '.\n' +
    '- Participação nas discussões e nas atividades em duplas/grupos.\n\n' +
    '4. Dificuldades e próximos passos\n' +
    'Alguns alunos ainda precisam de apoio para consolidar a habilidade. Próximos passos: retomar o tema com atividade de reforço em duplas e novo registro de observação.\n\n' +
    (b.confirmar ? 'Observação: a habilidade ' + b.codigo + ' está marcada como "a confirmar" no catálogo BNCC — conferir a descrição no texto oficial antes de entregar este relatório.\n\n' : '') +
    '_________________________________\n' + b.professor + '\n' + b.data;
}
function gerarAta(b) {
  return 'ATA DE REUNIÃO\n' +
    'Data: ' + b.data + ' | Turma: ' + b.turma + ' | Período: ' + b.periodo + '\n\n' +
    '1. Presentes\n' + b.professor + ' (professor(a) responsável) e demais membros da equipe pedagógica presentes.\n\n' +
    '2. Pauta\n' +
    '- Planejamento e acompanhamento da aula "' + b.tema + '" (' + b.componente + ', ' + b.ano + ').\n' +
    '- Habilidade BNCC trabalhada: ' + b.habilidade + '.\n' +
    '- Avaliação da turma e encaminhamentos.\n\n' +
    '3. Discussão\n' +
    'Foi apresentado o plano de aula do tema "' + b.tema + '", com objetivos, desenvolvimento em ' + b.duracao + ' minutos, atividades e avaliação. ' +
    'A equipe avaliou que o plano está adequado à etapa (' + b.etapa + ') e à realidade da turma.\n\n' +
    '4. Encaminhamentos\n' +
    '1. Aplicar o plano conforme o cronograma da turma.\n' +
    '2. Registrar a frequência e as observações de cada aula.\n' +
    '3. Retomar os casos de alunos com dificuldade na próxima reunião.\n\n' +
    'Nada mais havendo a tratar, lavra-se a presente ata, que será assinada pelos presentes.\n\n' +
    '_________________________________\n' + b.professor + '\n' + b.data;
}
function gerarFicha(b) {
  return 'FICHA DE AVALIAÇÃO\n' +
    'Turma: ' + b.turma + ' | Período: ' + b.periodo + ' | Data: ' + b.data + '\n' +
    'Aula: ' + b.tema + ' (' + b.componente + ', ' + b.ano + ')\n' +
    'Habilidade BNCC: ' + b.habilidade + '\n\n' +
    'Aluno(a): ________________________________________\n\n' +
    'Para cada critério, marque um nível: (A) Ainda não | (E) Em desenvolvimento | (T) Atingido\n\n' +
    '1. Participa das atividades propostas sobre "' + b.tema + '" — ( ) A  ( ) E  ( ) T\n' +
    '2. Demonstra a habilidade ' + b.codigo + ' nas produções e respostas — ( ) A  ( ) E  ( ) T\n' +
    '3. Trabalha em dupla/grupo respeitando os colegas — ( ) A  ( ) E  ( ) T\n' +
    '4. Registra o que aprendeu (caderno, desenho ou produção) — ( ) A  ( ) E  ( ) T\n\n' +
    'Observações do(a) professor(a):\n________________________________________________________________________\n\n' +
    '_________________________________\n' + b.professor + '\n' + b.data;
}
function gerarParecer(b) {
  var aluno = ($('doc-turma').value.trim() && $('doc-turma').value.trim().indexOf('ano') === -1 && $('doc-turma').value.trim().indexOf('série') === -1)
    ? $('doc-turma').value.trim() : 'o(a) aluno(a)';
  return 'PARECER DESCRITIVO\n' +
    'Aluno(a): ' + aluno + ' | Turma: ' + b.turma + ' | Período: ' + b.periodo + ' | Data: ' + b.data + '\nProfessor(a): ' + b.professor + '\n\n' +
    'No período, ' + aluno + ' participou das aulas de ' + b.componente + ' (' + b.ano + '), incluindo o trabalho com o tema "' + b.tema + '", ' +
    'alinhado à habilidade BNCC ' + b.habilidade + '.\n\n' +
    'Avanços: ' + aluno + ' demonstrou participação nas atividades, progrediu na compreensão do tema e conseguiu registrar o que aprendeu, com apoio do(a) professor(a) e dos colegas quando necessário.\n\n' +
    'Dificuldades: ainda há pontos a consolidar na habilidade ' + b.codigo + ', que seguirão sendo trabalhados com atividades de reforço e acompanhamento individual.\n\n' +
    'Orientações: recomenda-se continuar o acompanhamento em sala, com tarefas em dupla e retomadas do tema, e manter o diálogo com a família sobre a rotina de estudos.\n\n' +
    (b.confirmar ? 'Observação: a habilidade ' + b.codigo + ' está marcada como "a confirmar" no catálogo BNCC — conferir a descrição no texto oficial antes de entregar este parecer.\n\n' : '') +
    '_________________________________\n' + b.professor + '\n' + b.data;
}
function gerarDocumentos() {
  if (!ultimoPlano) return false;
  var b = baseDocs();
  _textosDocsLocais = {
    relatorio: gerarRelatorio(b),
    ata: gerarAta(b),
    ficha: gerarFicha(b),
    parecer: gerarParecer(b),
  };
  $('txt-relatorio').value = _textosDocsLocais.relatorio;
  $('txt-ata').value = _textosDocsLocais.ata;
  $('txt-ficha').value = _textosDocsLocais.ficha;
  $('txt-parecer').value = _textosDocsLocais.parecer;
  return true;
}
// Com IA real ativa, reescreve cada documento com o provedor escolhido
// (mesmo motor dos planos). Sem IA, mantém o texto do modelo local.
async function melhorarDocumentosComIA() {
  if (modoIA() === 'demo') return;
  var mapa = { relatorio: 'txt-relatorio', ata: 'txt-ata', ficha: 'txt-ficha', parecer: 'txt-parecer' };
  var prov = provedorAtual();
  var ok = 0, falhas = 0;
  for (var tipo in mapa) {
    var campo = $(mapa[tipo]);
    if (!campo.value.trim()) continue;
    campo.value = 'Reescrevendo com a IA (' + prov.nome + ')… aguarde.';
    var novo = await melhorarDocumentoComIA(tipo, gerarDocumentosTextoOriginal(tipo));
    if (novo) { campo.value = novo; ok++; } else { campo.value = gerarDocumentosTextoOriginal(tipo); falhas++; }
  }
  if (ok) avisar('Documentações reescritas pela IA (' + prov.nome + ' ' + prov.modelo + '). Revise cada texto antes de copiar ou imprimir.');
  else if (falhas) avisar('Não foi possível usar a IA para as documentações — mantidos os textos do modelo local. Verifique a chave na aba “Planos e IA”.');
}
var _textosDocsLocais = {};
function gerarDocumentosTextoOriginal(tipo) { return _textosDocsLocais[tipo] || ''; }
$('btn-gerar-docs').addEventListener('click', async function () {
  if (!ultimoPlano) { avisar('Gere primeiro um plano de aula na aba “Gerador de plano”.'); return; }
  gerarDocumentos();
  setBrito('comemorando');
  document.getElementById('brito-fala').textContent = 'Documentações prontas! Revise cada texto, copie ou imprima — relatório, ata, ficha e parecer estão logo abaixo.';
  $('lista-docs').scrollIntoView({ behavior: 'smooth' });
  if (modoIA() !== 'demo') {
    setBrito('pensando');
    await melhorarDocumentosComIA();
    setBrito('comemorando');
  }
});
// "Melhorar com IA" por documento (um de cada vez, com o provedor escolhido).
document.querySelectorAll('[data-melhorar]').forEach(function (btn) {
  btn.addEventListener('click', async function () {
    var tipo = btn.dataset.melhorar;
    if (modoIA() === 'demo') { avisar('Sem IA real ativa — configure uma chave na aba “Planos e IA” para melhorar este documento com IA.'); return; }
    var mapa = { relatorio: 'txt-relatorio', ata: 'txt-ata', ficha: 'txt-ficha', parecer: 'txt-parecer' };
    var campo = $(mapa[tipo]);
    if (!campo.value.trim()) { avisar('Gere as documentações primeiro (botão “Gerar as 4 documentações”).'); return; }
    var original = campo.value;
    campo.value = 'Reescrevendo com a IA (' + provedorAtual().nome + ')… aguarde.';
    var novo = await melhorarDocumentoComIA(tipo, original);
    if (novo) { campo.value = novo; avisar('Documento melhorado pela IA (' + provedorAtual().nome + ' ' + provedorAtual().modelo + '). Revise antes de copiar ou imprimir.'); }
    else { campo.value = original; avisar('Não foi possível usar a IA — mantido o texto anterior. Verifique a chave na aba “Planos e IA”.'); }
  });
});
$('btn-exemplo-docs').addEventListener('click', function () {
  ultimoPlano = { etapaNome: 'Ensino Fundamental — Anos Iniciais', etapa: 'fundamental-anos-iniciais', componente: 'Língua Portuguesa', sigla: 'LP', ano: '2º ano', habilidade: { codigo: 'EF02LP01', descricao: 'Utilizar, ao produzir o texto, grafia correta de palavras conhecidas ou com estruturas silábicas já dominadas.', status: 'a confirmar' }, tema: 'Produção de bilhetes para os colegas', duracao: '50', turma: $('doc-turma').value.trim() || '2º ano B' };
  $('docs-sem-plano').hidden = true;
  gerarDocumentos();
});
$('btn-ir-docs').addEventListener('click', function () {
  trocarAba('docs');
  if (ultimoPlano) { $('docs-sem-plano').hidden = true; gerarDocumentos(); }
});
$('btn-ir-slides').addEventListener('click', function () {
  trocarAba('slides');
  if (window.__brittechSlides) window.__brittechSlides.irParaSlides();
});

// ---------------------------------------------------------------- Copiar / imprimir
function copiarTexto(texto, botao) {
  function feedback() {
    if (!botao) return;
    var orig = botao.textContent;
    botao.textContent = 'Copiado!';
    setTimeout(function () { botao.textContent = orig; }, 1500);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(feedback).catch(function () { copiarFallback(texto); feedback(); });
  } else { copiarFallback(texto); feedback(); }
}
function copiarFallback(texto) {
  var ta = document.createElement('textarea');
  ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (e) { /* sem acesso à área de transferência */ }
  document.body.removeChild(ta);
}
$('btn-copiar-plano').addEventListener('click', function (ev) {
  copiarTexto($('resultado').innerText, ev.currentTarget);
});
document.querySelectorAll('[data-copiar]').forEach(function (btn) {
  btn.addEventListener('click', function () { copiarTexto($(btn.dataset.copiar).value, btn); });
});
function imprimirHtml(titulo, htmlCorpo) {
  var area = $('area-impressao');
  area.innerHTML = '<h1>Brittech Educação</h1><h2>' + esc(titulo) + '</h2>' + htmlCorpo + '<p><small>Gerado pelo Brittech Educação — Sua aula pronta, do planejamento à prática.</small></p>';
  document.body.classList.add('imprimindo-doc');
  try { window.print(); } catch (e) { /* impressão indisponível neste navegador */ }
  setTimeout(function () { document.body.classList.remove('imprimindo-doc'); }, 500);
}
$('btn-imprimir-plano').addEventListener('click', function () {
  imprimirHtml('Plano de aula — ' + (ultimoPlano ? ultimoPlano.tema : ''), $('resultado').innerHTML);
});
document.querySelectorAll('[data-imprimir]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var mapa = { relatorio: ['Relatório de turma', 'txt-relatorio'], ata: ['Ata de reunião', 'txt-ata'], ficha: ['Ficha de avaliação', 'txt-ficha'], parecer: ['Parecer descritivo', 'txt-parecer'] };
    var m = mapa[btn.dataset.imprimir];
    var texto = $(m[1]).value;
    if (!texto.trim()) { avisar('Gere as documentações primeiro (botão “Gerar as 4 documentações”).'); return; }
    imprimirHtml(m[0], '<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px">' + esc(texto) + '</pre>');
  });
});
window.addEventListener('afterprint', function () { document.body.classList.remove('imprimindo-doc'); });

// ---------------------------------------------------------------- Catálogo
function renderCatalogo(filtro) {
  var q = (filtro || '').toLowerCase();
  var total = 0, html = '';
  for (var i = 0; i < ENTRADAS.length; i++) {
    var e = ENTRADAS[i];
    var habs = e.habilidades.filter(function (h) {
      return !q || h.codigo.toLowerCase().indexOf(q) !== -1 || h.descricao.toLowerCase().indexOf(q) !== -1 || e.nome.toLowerCase().indexOf(q) !== -1 || e.sigla.toLowerCase().indexOf(q) !== -1;
    });
    if (!habs.length) continue;
    total += habs.length;
    html += '<div class="item-catalogo"><strong>' + esc(e.etapaNome) + ' — ' + esc(e.nome) + '</strong> <span class="tag">' + esc(e.tipo) + '</span><br>' +
      habs.map(function (h) { return '<code>' + esc(h.codigo) + '</code> ' + esc(h.descricao) + (h.status === 'a confirmar' ? ' <span class="tag confirmar">a confirmar</span>' : ''); }).join('<br>') + '</div>';
  }
  $('catalogo').innerHTML = html || '<p>Nenhum resultado para essa busca.</p>';
  $('busca-contagem').textContent = q ? total + ' habilidade(s) encontrada(s) para “' + filtro + '”.' : 'Catálogo completo: ' + ENTRADAS.reduce(function (n, e) { return n + e.habilidades.length; }, 0) + ' habilidades de exemplo.';
}
$('busca').addEventListener('input', function (ev) { renderCatalogo(ev.target.value); });

// ---------------------------------------------------------------- Abas
function trocarAba(nome) {
  document.querySelectorAll('.aba').forEach(function (b) { b.classList.toggle('ativa', b.dataset.aba === nome); });
  ['gerador', 'docs', 'catalogo', 'slides', 'planos'].forEach(function (n) { $('aba-' + n).hidden = n !== nome; });
}
document.querySelectorAll('.aba').forEach(function (b) {
  b.addEventListener('click', function () { trocarAba(b.dataset.aba); });
});

// ---------------------------------------------------------------- Planos / IA (UI)
document.querySelectorAll('.btn-plano').forEach(function (btn) {
  btn.addEventListener('click', function () { trocarPlano(btn.dataset.plano); });
});
$('seletor-provedor').addEventListener('change', function (ev) {
  provedorId = ev.target.value;
  if (!PROVEDORES[provedorId]) provedorId = 'deepseek';
  localStorage.setItem(CHAVE_PROVEDOR, provedorId);
  atualizarCamposIA();
  avisar('Provedor de IA: ' + provedorAtual().nome + ' (' + provedorAtual().modelo + '). ' + (obterChave() ? 'Chave já configurada para este provedor.' : 'Configure a chave abaixo para ativar a IA real.'));
});
$('btn-salvar-chave').addEventListener('click', function () {
  var v = $('chave-ia').value.trim();
  var prov = provedorAtual();
  if (!v) { avisar('Cole a chave da API do ' + prov.nome + ' no campo antes de salvar. Veja CONFIG.md para saber onde criar a chave.'); return; }
  localStorage.setItem(CHAVES_IA[provedorId], v);
  $('chave-ia').value = '';
  atualizarModoIA();
  avisar('Chave do ' + prov.nome + ' salva neste navegador. A IA real (' + prov.nome + ' ' + prov.modelo + ') será usada no próximo plano gerado e nas documentações.');
});
$('btn-remover-chave').addEventListener('click', function () {
  var prov = provedorAtual();
  localStorage.removeItem(CHAVES_IA[provedorId]);
  atualizarModoIA();
  avisar('Chave do ' + prov.nome + ' removida. ' + (modoIA() === 'demo' ? 'Voltamos ao modo demonstração, sem IA real.' : 'Outro provedor continua com chave — o provedor em uso agora é ' + provedorAtual().nome + '.'));
});
$('btn-salvar-proxy').addEventListener('click', function () {
  var v = ($('proxy-url').value || '').trim().replace(/\/+$/, '');
  if (v) {
    if (!/^https?:\/\//.test(v)) { avisar('A URL do proxy precisa começar com http:// ou https:// — ex.: https://brittech-proxy.onrender.com'); return; }
    localStorage.setItem(CHAVE_PROXY, v);
    atualizarModoIA();
    atualizarCamposIA();
    avisar('Proxy salvo: ' + v + '. A IA real agora passa pelo proxy (a chave fica só no servidor). Teste a conexão abaixo.');
  } else {
    localStorage.removeItem(CHAVE_PROXY);
    atualizarModoIA();
    atualizarCamposIA();
    avisar('Proxy removido. O MVP volta a chamar a API direto do navegador (ou ao modo demonstração, sem chave).');
  }
});
$('btn-testar-ia').addEventListener('click', async function () {
  var prov = provedorAtual();
  if (modoIA() === 'demo') { avisar('Sem chave configurada para ' + prov.nome + ' e sem proxy — modo demonstração, sem IA real. Cole sua chave e salve, ou configure a URL do proxy, para testar.'); return; }
  $('status-ia').textContent = 'Testando conexão com a IA (' + prov.nome + ')…';
  try {
    var texto = await chamarIA('Responda apenas: ok', 'Responda apenas com a palavra ok.');
    $('status-ia').textContent = 'Status da IA: conexão OK — ' + prov.nome + ' ' + prov.modelo + ' respondeu (“' + texto.trim().slice(0, 40) + '”).';
  } catch (err) {
    $('status-ia').textContent = 'Status da IA: falha na conexão com ' + prov.nome + ' (' + err.message + '). Verifique a chave e a internet; o MVP segue em modo demonstração. (DeepSeek e Maritaca podem bloquear chamadas diretas do navegador — veja CONFIG.md.)';
  }
});

// ---------------------------------------------------------------- Formulário: encadeamento
preencher(etapaSel, BNCC_DATA.etapas.map(function (e) { return { value: e.id, label: e.nome }; }), 'Escolha a etapa');
etapaSel.addEventListener('change', atualizarComponentes);
compSel.addEventListener('change', atualizarAnos);
anoSel.addEventListener('change', atualizarHabilidades);
habSel.addEventListener('change', atualizarAvisoHabilidade);
$('filtro-habilidade').addEventListener('input', atualizarHabilidades);
renderCatalogo('');
atualizarContador();
atualizarCamposIA();
setBrito('saudacao');

// ---------------------------------------------------------------- Ganchos p/ testes automatizados (não afetam o uso normal)
window.__brittech = {
  versao: 'mvp-1.0',
  getState: function () {
    return { plano: planoAtual, limite: limiteAtual(), usados: usados, modo: modoIA(), provedor: provedorId, provedorModelo: provedorAtual().modelo, proxyUrl: obterProxyUrl(), brito: britoAtual, gerando: gerando, ultimoPlano: ultimoPlano ? { tema: ultimoPlano.tema, etapa: ultimoPlano.etapa, habilidade: ultimoPlano.habilidade.codigo } : null };
  },
  setUsados: function (n) { usados = n; salvarUso(); atualizarContador(); },
  setPlano: function (p) { if (PLANOS[p]) trocarPlano(p); },
  setProvedor: function (p) { if (PROVEDORES[p]) { provedorId = p; localStorage.setItem(CHAVE_PROVEDOR, p); atualizarCamposIA(); } },
  setChave: function (p, k) { if (CHAVES_IA[p]) { localStorage.setItem(CHAVES_IA[p], k); atualizarModoIA(); } },
  setDelay: function (ms) { DEMO_DELAY_MS = ms; },
  // Preenche o formulário por valores e envia. Ex.: {etapa:'ensino-medio', componente:'Matemática e suas Tecnologias', ano:'1ª série', habilidade:'EM13MAT101', tema:'...', duracao:'50'}
  preencherFormulario: function (d) {
    etapaSel.value = d.etapa; atualizarComponentes();
    var lista = ENTRADAS.filter(function (x) { return x.etapa === d.etapa; });
    for (var i = 0; i < lista.length; i++) { if (lista[i].nome === d.componente) { compSel.value = String(i); break; } }
    atualizarAnos();
    anoSel.value = d.ano; atualizarHabilidades();
    var habs = JSON.parse(habSel.dataset.lista || '[]');
    for (var j = 0; j < habs.length; j++) { if (habs[j].codigo === d.habilidade) { habSel.value = String(j); break; } }
    atualizarAvisoHabilidade();
    $('tema').value = d.tema || 'Tema de teste';
    if (d.duracao) $('duracao').value = d.duracao;
    if (d.turma) $('turma').value = d.turma;
  },
  submeterFormulario: function () { $('form-plano').dispatchEvent(new Event('submit', { cancelable: true })); },
  gerarDocumentos: gerarDocumentos,
  // Ganchos para o módulo de slides (slides.js).
  getUltimoPlano: function () { return ultimoPlano; },
  chamarIA: chamarIA,
  modoIA: modoIA,
  provedorAtual: provedorAtual,
};
