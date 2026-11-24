// Brittech Educação — Módulo de slides (slides.js)
// Estilo de apresentação gerada por IA (tipo Gemini Notebook / NotebookLM):
// título curto e forte, pouco texto por slide (frases curtas e pontos-chave,
// nunca parágrafos), um elemento visual por slide (diagrama, quadro, linha
// do tempo, comparação ou destaque numerado), notas do apresentador em cada
// slide e uma imagem por slide de conteúdo.
//
// IMAGENS: ilustrações ORIGINAIS em SVG, desenhadas aqui no código, no
// estilo da marca (azul-marinho #0A2540, ciano #0284C7, verde-limão #84CC16).
// Nunca foto de banco de imagem com pessoas reais e nunca imagem de menor
// de idade. Não há geração de imagem por IA neste MVP — ver README.md para
// ligar imagens geradas depois.
//
// MARCA NOS SLIDES: SEM o mascote Brito nos slides (decisão do Thiago).
// A única marca é a marca d'água discreta "Brittech Educação" no canto
// inferior direito de cada slide, além da paleta e da tipografia.
//
// EXPORTAÇÃO: "Baixar PPT" gera um .pptx de verdade (gerador próprio em
// JavaScript puro, sem CDN e sem dependência externa — o PPTX é um ZIP de
// XMLs montado aqui mesmo). "Baixar PDF" imprime os slides, um por página,
// pelo CSS de impressão (window.print).
// Sem chave de IA: slides gerados pelo modelo local (montarSlides) com
// aviso de modo demonstração. Com chave: a IA do provedor escolhido
// (Maritaca é o principal — o Thiago tem saldo; DeepSeek e Gemini seguem
// como opções) gera o roteiro em JSON via chamarIA() (de app.js).

(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function slug(s) {
    return String(s || 'aula').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'aula';
  }

  // ---------------------------------------------------------- Ilustrações
  // Originais, desenhadas em SVG. Chaves usadas pelo gerador (local e IA).
  var ILUSTRACOES = {
    leitura: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Livro aberto com um sol nascendo"><rect width="400" height="300" rx="16" fill="#E0F2F7"/><circle cx="300" cy="70" r="34" fill="#84CC16"/><path d="M300 22v14M300 104v14M252 70h14M334 70h14" stroke="#84CC16" stroke-width="6" stroke-linecap="round"/><path d="M200 90 C160 60 110 60 80 85 L80 230 C110 205 160 205 200 230 C240 205 290 205 320 230 L320 85 C290 60 240 60 200 90 Z" fill="#FFFFFF" stroke="#0A2540" stroke-width="6" stroke-linejoin="round"/><path d="M200 90 V230" stroke="#0A2540" stroke-width="5"/><path d="M100 120h70M100 150h70M100 180h50M230 120h70M230 150h70M230 180h50" stroke="#0284C7" stroke-width="7" stroke-linecap="round"/></svg>',
    numeros: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Blocos com números somando"><rect width="400" height="300" rx="16" fill="#E0F2F7"/><rect x="60" y="110" width="80" height="80" rx="14" fill="#0A2540"/><text x="100" y="168" font-size="52" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">2</text><text x="168" y="168" font-size="52" font-weight="bold" fill="#0284C7" text-anchor="middle" font-family="Arial">+</text><rect x="210" y="110" width="80" height="80" rx="14" fill="#0284C7"/><text x="250" y="168" font-size="52" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">3</text><text x="310" y="168" font-size="52" font-weight="bold" fill="#0A2540" text-anchor="middle" font-family="Arial">=</text><circle cx="358" cy="150" r="24" fill="#84CC16"/><text x="358" y="166" font-size="30" font-weight="bold" fill="#0A2540" text-anchor="middle" font-family="Arial">5</text><path d="M80 230h240" stroke="#0A2540" stroke-width="6" stroke-linecap="round"/></svg>',
    experimento: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Frasco de experimento com bolhas"><rect width="400" height="300" rx="16" fill="#E0F2F7"/><path d="M175 70h50M185 70v60l-55 95a28 28 0 0 0 24 42h92a28 28 0 0 0 24-42l-55-95V70" fill="#FFFFFF" stroke="#0A2540" stroke-width="6" stroke-linejoin="round"/><path d="M150 200h100l14 25a28 28 0 0 1-24 42h-80a28 28 0 0 1-24-42z" fill="#0284C7"/><circle cx="185" cy="180" r="10" fill="#84CC16"/><circle cx="215" cy="160" r="7" fill="#84CC16"/><circle cx="200" cy="135" r="5" fill="#84CC16"/><path d="M120 60h40M310 90h30" stroke="#84CC16" stroke-width="8" stroke-linecap="round"/></svg>',
    mapa: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa com um caminho e um marcador"><rect width="400" height="300" rx="16" fill="#E0F2F7"/><path d="M40 90 C110 50 170 120 230 80 C290 40 340 90 360 70 L360 240 C300 270 240 210 180 240 C120 270 70 220 40 240 Z" fill="#FFFFFF" stroke="#0A2540" stroke-width="6" stroke-linejoin="round"/><path d="M60 220 C120 180 170 200 220 150 C260 112 300 130 340 90" fill="none" stroke="#0284C7" stroke-width="6" stroke-dasharray="12 10" stroke-linecap="round"/><path d="M220 105c-18 0-30 12-30 28 0 20 30 48 30 48s30-28 30-48c0-16-12-28-30-28z" fill="#84CC16" stroke="#0A2540" stroke-width="5"/><circle cx="220" cy="133" r="9" fill="#0A2540"/><circle cx="80" cy="200" r="10" fill="#0284C7"/></svg>',
    tempo: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Linha do tempo com três marcos"><rect width="400" height="300" rx="16" fill="#E0F2F7"/><path d="M50 150h300" stroke="#0A2540" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="150" r="24" fill="#0284C7"/><circle cx="200" cy="150" r="24" fill="#84CC16"/><circle cx="300" cy="150" r="24" fill="#0A2540"/><text x="100" y="160" font-size="22" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">1</text><text x="200" y="160" font-size="22" font-weight="bold" fill="#0A2540" text-anchor="middle" font-family="Arial">2</text><text x="300" y="160" font-size="22" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial">3</text><path d="M100 100v-20M200 100v-20M300 100v-20" stroke="#0284C7" stroke-width="5" stroke-linecap="round"/><text x="100" y="70" font-size="20" font-weight="bold" fill="#0A2540" text-anchor="middle" font-family="Arial">Antes</text><text x="200" y="70" font-size="20" font-weight="bold" fill="#0A2540" text-anchor="middle" font-family="Arial">Agora</text><text x="300" y="70" font-size="20" font-weight="bold" fill="#0A2540" text-anchor="middle" font-family="Arial">Depois</text></svg>',
    arte: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Paleta de artista"><rect width="400" height="300" rx="16" fill="#E0F2F7"/><path d="M200 50c70 0 120 45 120 100 0 55-50 100-120 100-25 0-45-7-60-18-12-9-12-25 0-32 10-6 14-18 8-28-7-12-3-26 8-32 12-7 28-10 44-10z" fill="#FFFFFF" stroke="#0A2540" stroke-width="6" stroke-linejoin="round"/><circle cx="160" cy="120" r="16" fill="#0284C7"/><circle cx="210" cy="100" r="16" fill="#84CC16"/><circle cx="255" cy="130" r="16" fill="#0A2540"/><circle cx="250" cy="185" r="16" fill="#F59E0B"/><circle cx="195" cy="200" r="16" fill="#22C55E"/></svg>',
    dialogo: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dois balões de diálogo"><rect width="400" height="300" rx="16" fill="#E0F2F7"/><path d="M60 70h180a24 24 0 0 1 24 24v60a24 24 0 0 1-24 24H150l-30 30v-30H84a24 24 0 0 1-24-24V94a24 24 0 0 1 24-24z" fill="#0284C7"/><path d="M90 110h140M90 135h100" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M170 190h150a24 24 0 0 1 24 24v40a24 24 0 0 1-24 24h-60l-28 26v-26h-62a24 24 0 0 1-24-24v-40a24 24 0 0 1 24-24z" fill="#84CC16"/><path d="M200 225h110M200 248h80" stroke="#0A2540" stroke-width="8" stroke-linecap="round"/></svg>',
    movimento: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bola e setas de movimento"><rect width="400" height="300" rx="16" fill="#E0F2F7"/><circle cx="200" cy="140" r="55" fill="#0284C7"/><path d="M185 140a15 15 0 0 1 30 0" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M60 140h60M280 140h60" stroke="#0A2540" stroke-width="8" stroke-linecap="round"/><path d="M100 140l14-14M100 140l14 14M320 140l-14-14M320 140l-14 14" stroke="#0A2540" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M120 230h160" stroke="#84CC16" stroke-width="8" stroke-linecap="round"/><circle cx="120" cy="230" r="12" fill="#84CC16"/><circle cx="280" cy="230" r="12" fill="#84CC16"/></svg>',
    lupa: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lupa sobre uma estrela"><rect width="400" height="300" rx="16" fill="#E0F2F7"/><circle cx="185" cy="135" r="75" fill="#FFFFFF" stroke="#0A2540" stroke-width="8"/><circle cx="185" cy="135" r="58" fill="none" stroke="#0284C7" stroke-width="4"/><path d="M185 95l12 24 26 4-19 18 4 26-23-12-23 12 4-26-19-18 26-4z" fill="#84CC16" stroke="#0A2540" stroke-width="4" stroke-linejoin="round"/><path d="M240 190l55 55" stroke="#0A2540" stroke-width="16" stroke-linecap="round"/></svg>',
  };
  var IMAGEM_POR_SIGLA = {
    LP: 'leitura', MA: 'numeros', CI: 'experimento', GE: 'mapa', HI: 'tempo',
    AR: 'arte', LI: 'dialogo', EF: 'movimento', ER: 'dialogo', EO: 'dialogo',
    CG: 'movimento', TS: 'arte', EF2: 'leitura', ET: 'numeros',
  };
  var IMAGENS_CONTEUDO = ['leitura', 'numeros', 'experimento', 'mapa', 'tempo', 'arte', 'dialogo', 'lupa'];

  // ---------------------------------------------------------- Quantidade
  // O Thiago escolhe de 6 a 33 slides por apresentação (padrão: 8).
  // Estrutura fixa: capa + objetivos + atividade + resumo + fechamento
  // (5 slides); o restante são slides de conteúdo, de 1 a 28.
  var QTD_MIN_SLIDES = 6, QTD_MAX_SLIDES = 33, QTD_PADRAO_SLIDES = 8;
  function limitarQtdSlides(q) {
    var n = parseInt(q, 10);
    if (isNaN(n)) return QTD_PADRAO_SLIDES;
    return Math.max(QTD_MIN_SLIDES, Math.min(QTD_MAX_SLIDES, n));
  }

  // ---------------------------------------------------------- Modelo de slide
  // slide = { tipo, titulo, subtitulo?, pontos[], visual:{tipo, titulo?, itens[]}, imagem?, notas }
  // visual.tipo: 'numeros' | 'quadro' | 'comparacao' | 'timeline' | 'diagrama' | 'destaque'
  // pontos: frases curtas (até ~8 palavras cada), no máximo 4 por slide.
  //
  // Ângulos de conteúdo: um por slide de conteúdo, cada um com título,
  // pontos, visual e notas próprios — para que uma apresentação de 33
  // slides (28 de conteúdo) não repita slides. Os 3 primeiros ângulos
  // são os do deck padrão de 8 slides.
  var ANGULOS_CONTEUDO = [
    function (d) {
      return { titulo: 'A ideia principal', pontos: ['O tema de hoje é ' + d.tema, 'Ele se liga à habilidade ' + d.habilidade.codigo, 'Vamos ver com um exemplo concreto'], visual: { tipo: 'diagrama', titulo: d.tema, itens: ['O que é?', 'Para que serve?', 'Onde aparece?'] }, notas: 'Apresente a ideia principal com o exemplo do slide. Pergunte à turma onde ela já viu isso no dia a dia — dois ou três alunos respondem antes de continuar.' };
    },
    function (d) {
      return { titulo: 'Na prática', pontos: ['Um exemplo passo a passo', 'Erros comuns — e como evitar', 'O que muda na resposta'], visual: { tipo: 'comparacao', titulo: 'Antes e depois', itens: ['Antes: tentativa inicial', 'Depois: com a estratégia'] }, notas: 'Faça o exemplo junto com a turma, no quadro. Mostre o erro mais comum primeiro e pergunte: o que está errado aqui? Só depois mostre a forma certa.' };
    },
    function (d) {
      return { titulo: 'Passo a passo', pontos: ['Primeiro, observamos', 'Depois, tentamos juntos', 'Por fim, cada um faz o seu'], visual: { tipo: 'timeline', titulo: 'A aula em 3 tempos', itens: ['Observar', 'Tentar junto', 'Fazer sozinho'] }, notas: 'Siga a linha do tempo do slide. Dê tempo para cada etapa: observar, tentar junto e só então deixar cada aluno fazer sozinho. Circule pela sala na última etapa.' };
    },
    function (d) {
      return { titulo: 'Um exemplo do dia a dia', pontos: ['Onde isso aparece na sua vida?', 'Um caso perto de você', 'O que você faria?'], visual: { tipo: 'quadro', titulo: 'Perto de você', itens: ['Em casa', 'Na escola', 'Na rua'] }, notas: 'Traga o tema para a vida dos alunos com o exemplo do slide. Peça um exemplo de cada fileira antes de avançar.' };
    },
    function (d) {
      return { titulo: 'Erros comuns', pontos: ['O erro mais frequente', 'Por que ele acontece', 'Como não cair nele'], visual: { tipo: 'comparacao', titulo: 'Certo e errado', itens: ['Errado: pular a etapa', 'Certo: seguir a ordem'] }, notas: 'Mostre os erros comuns sem apontar ninguém. Pergunte se alguém já cometeu esse erro — normalizar o erro deixa a turma à vontade para tentar.' };
    },
    function (d) {
      return { titulo: 'Perguntas para pensar', pontos: ['O que aconteceria se...?', 'Por que isso funciona?', 'E se mudássemos uma parte?'], visual: { tipo: 'quadro', titulo: 'Pense com a turma', itens: ['E se...?', 'Por quê?', 'E agora?'] }, notas: 'Faça as perguntas uma de cada vez e espere as respostas. Não responda você: deixe a turma formular hipóteses antes de confirmar.' };
    },
    function (d) {
      return { titulo: 'Compare e decida', pontos: ['Duas formas de resolver', 'Vantagem de cada uma', 'Qual você escolheria?'], visual: { tipo: 'comparacao', titulo: 'Qual é melhor?', itens: ['Forma A: mais rápida', 'Forma B: mais segura'] }, notas: 'Coloque as duas formas lado a lado e peça para a turma votar. Depois mostre que cada forma serve para um caso — não há uma única certa.' };
    },
    function (d) {
      return { titulo: 'Em números', pontos: ['Um dado que chama atenção', 'O que esse número mostra', 'E na nossa turma?'], visual: { tipo: 'numeros', titulo: '3 números para lembrar', itens: ['O dado', 'O que mostra', 'Na turma'] }, notas: 'Apresente o número do slide e pergunte o que a turma acha dele antes de explicar. Números viram conversa quando a turma tenta adivinhar primeiro.' };
    },
    function (d) {
      return { titulo: 'Palavras-chave', pontos: ['Três palavras desta aula', 'O que cada uma significa', 'Use-as na atividade'], visual: { tipo: 'quadro', titulo: 'Guarde estas palavras', itens: [d.tema, d.habilidade.codigo, d.componente] }, notas: 'Leia cada palavra-chave e peça para um aluno explicar com as próprias palavras. Essas palavras voltam na atividade prática.' };
    },
    function (d) {
      return { titulo: 'O que observar', pontos: ['Preste atenção neste detalhe', 'Ele muda o resultado', 'Anote o que você viu'], visual: { tipo: 'diagrama', titulo: 'Olho no detalhe', itens: ['O detalhe', 'Por que importa', 'O que anotar'] }, notas: 'Aponte o detalhe do slide e dê um tempo para a turma observar. Só depois explique por que ele muda o resultado.' };
    },
    function (d) {
      return { titulo: 'Desafio rápido', pontos: ['Resolva em 2 minutos', 'Compare com seu colega', 'Quem explica para a turma?'], visual: { tipo: 'numeros', titulo: 'Desafio em 3 passos', itens: ['Resolver', 'Comparar', 'Explicar'] }, notas: 'Lance o desafio com o cronômetro: dois minutos. Circule pela sala, ajude quem travou e escolha um aluno para explicar a solução no quadro.' };
    },
    function (d) {
      return { titulo: 'Ligando as ideias', pontos: ['O que vimos se liga a...', 'O tema de hoje com o de ontem', 'O que vem na próxima aula'], visual: { tipo: 'diagrama', titulo: 'Tudo se liga', itens: ['Hoje', 'Ontem', 'Amanhã'] }, notas: 'Mostre como o tema de hoje se liga ao que a turma já viu. Essa ligação é o que faz o conteúdo ficar na memória.' };
    },
    function (d) {
      return { titulo: 'Antes e depois', pontos: ['Como pensávamos antes', 'O que mudou agora', 'O que ainda vamos aprender'], visual: { tipo: 'timeline', titulo: 'O caminho da aula', itens: ['Antes', 'Agora', 'Depois'] }, notas: 'Volte ao início da aula: o que a turma achava antes? Mostre o que mudou e antecipe o que vem na próxima aula.' };
    },
    function (d) {
      return { titulo: 'Curiosidade', pontos: ['Um fato curioso sobre o tema', 'Por que isso acontece', 'Conte para alguém em casa'], visual: { tipo: 'destaque', itens: ['Você sabia?'] }, notas: 'Conte a curiosidade do slide como uma história curta. Curiosidade é o que a turma lembra e conta em casa — aproveite.' };
    },
  ];
  var PONTOS_APROFUNDAR = [
    ['O que já vimos até aqui', 'O que ainda falta entender', 'O que vem a seguir'],
    ['Um exemplo novo do tema', 'O que muda na resposta', 'Quando usar essa ideia'],
    ['Pergunte à turma: e se...?', 'Compare duas respostas', 'Escolha a melhor e explique'],
    ['Releia o objetivo da aula', 'Confira a habilidade ' + 'na BNCC', 'Marque o que já dominou'],
    ['Um caso diferente do anterior', 'O que é igual, o que muda', 'Resolva com seu colega'],
    ['Volte ao exemplo da capa', 'Teste com outros valores', 'O que acontece agora?'],
  ];
  var VISUAIS_APROFUNDAR = ['diagrama', 'comparacao', 'timeline', 'quadro', 'numeros', 'destaque'];
  function montarSlideConteudo(d, i, baseIdx) {
    var imagem = IMAGENS_CONTEUDO[(baseIdx + i) % IMAGENS_CONTEUDO.length];
    var angulo;
    if (i < ANGULOS_CONTEUDO.length) {
      angulo = ANGULOS_CONTEUDO[i](d);
    } else {
      // Acabaram os ângulos prontos: série "Aprofundando", numerada, com
      // pontos e visual rotativos — títulos sempre diferentes.
      var parte = i - ANGULOS_CONTEUDO.length + 1;
      var pool = PONTOS_APROFUNDAR[(parte - 1) % PONTOS_APROFUNDAR.length];
      var visTipo = VISUAIS_APROFUNDAR[(parte - 1) % VISUAIS_APROFUNDAR.length];
      angulo = {
        titulo: 'Aprofundando — parte ' + parte,
        pontos: pool.slice(),
        visual: { tipo: visTipo, titulo: 'Parte ' + parte + ' do tema', itens: pool.slice(0, 3) },
        notas: 'Aprofunde o tema com a parte ' + parte + '. Use os pontos do slide como roteiro: apresente, pergunte à turma e só avance quando a maioria acompanhar.',
      };
    }
    return { tipo: 'conteudo', titulo: angulo.titulo, pontos: angulo.pontos, visual: angulo.visual, imagem: imagem, notas: angulo.notas };
  }

  function montarSlides(d, total) {
    total = limitarQtdSlides(total);
    var nConteudo = total - 5; // capa, objetivos, atividade, resumo, fechamento
    var imgBase = IMAGEM_POR_SIGLA[d.sigla] || 'lupa';
    var baseIdx = IMAGENS_CONTEUDO.indexOf(imgBase);
    if (baseIdx === -1) baseIdx = 0;
    var slides = [
      { tipo: 'capa', titulo: d.tema, subtitulo: d.componente + ' • ' + d.ano, pontos: [d.etapaNome, 'Duração: ' + d.duracao + ' minutos'], visual: { tipo: 'destaque', itens: [d.habilidade.codigo] }, imagem: null, notas: 'Bom dia, turma! Hoje vamos trabalhar "' + d.tema + '". A aula dura ' + d.duracao + ' minutos e está ligada à habilidade ' + d.habilidade.codigo + ' da BNCC. Apresente o tema com uma pergunta: o que vocês já sabem sobre isso?' },
      { tipo: 'objetivos', titulo: 'O que vamos aprender', pontos: ['Entender o tema da aula', 'Usar a habilidade ' + d.habilidade.codigo, 'Praticar e registrar o que aprendeu'], visual: { tipo: 'numeros', titulo: '3 metas de hoje', itens: ['Entender', 'Praticar', 'Registrar'] }, imagem: null, notas: 'Leia os três objetivos em voz alta e pergunte se alguém já conhece o tema. Deixe claro o que a turma vai conseguir fazer ao final da aula.' },
    ];
    for (var i = 0; i < nConteudo; i++) slides.push(montarSlideConteudo(d, i, baseIdx));
    slides.push(
      { tipo: 'atividade', titulo: 'Mão na massa', pontos: ['Trabalhem em duplas', 'Registrem no caderno', 'Apresentem para a turma'], visual: { tipo: 'numeros', titulo: '3 passos da atividade', itens: ['Em duplas', 'Registrar', 'Apresentar'] }, imagem: null, notas: 'Organize as duplas e explique a atividade em até um minuto. Dê o tempo combinado e avise quando faltarem cinco minutos. Escolha duas ou três duplas para apresentar.' },
      { tipo: 'resumo', titulo: 'Para lembrar', pontos: ['O tema: ' + d.tema, 'A habilidade: ' + d.habilidade.codigo, 'A estratégia que usamos hoje'], visual: { tipo: 'destaque', itens: [d.tema] }, imagem: null, notas: 'Retome os três pontos do slide e peça para um aluno resumir a aula com as próprias palavras. Reforce a estratégia usada — é ela que a turma leva para a próxima aula.' },
      { tipo: 'fechamento', titulo: 'Fechamento', pontos: ['O que você aprendeu hoje?', 'Onde você usaria isso?', 'O que ainda ficou difícil?'], visual: { tipo: 'quadro', titulo: 'Avaliação rápida', itens: ['Aprendi', 'Usaria', 'Dúvida'] }, imagem: null, notas: 'Faça as três perguntas do slide e ouça algumas respostas. Anote quem atingiu a habilidade ' + d.habilidade.codigo + ' e quem precisa de apoio na próxima aula.' },
    );
    return slides;
  }

  // ---------------------------------------------------------- IA (roteiro em JSON)
  var PROMPT_SISTEMA_SLIDES = 'Você é um assistente que cria roteiros de slides de aula no estilo de apresentação gerada por IA (tipo Gemini Notebook). Responda SEMPRE em português, em JSON válido, sem nenhum texto fora do JSON. Regras: título curto e forte (até 6 palavras); no máximo 4 pontos por slide, cada ponto com até 8 palavras; nada de parágrafos; cada slide tem notas do apresentador (2 a 4 frases, o que o professor fala). Não invente outra habilidade BNCC além da informada.';
  var IMAGENS_VALIDAS = Object.keys(ILUSTRACOES);

  async function gerarSlidesComIA(dados, total) {
    total = limitarQtdSlides(total);
    var hook = window.__brittech;
    if (!hook || hook.modoIA() === 'demo') {
      return { slides: montarSlides(dados, total), fonte: 'demo' };
    }
    var nConteudo = total - 5;
    var prompt = 'Crie o roteiro de EXATAMENTE ' + total + ' slides de aula, em JSON, com esta estrutura exata:\n' +
      '[{"tipo":"capa","titulo":"...","subtitulo":"...","pontos":["..."],"visual":{"tipo":"destaque","itens":["..."]},"imagem":null,"notas":"..."}, ...]\n\n' +
      'Tipos de slide, nesta ordem: capa, objetivos, ' + nConteudo + ' slides de conteudo, atividade, resumo, fechamento. São ' + total + ' slides no total — nem um a mais, nem um a menos. Cada slide de conteúdo tem um ângulo diferente (ideia principal, exemplo do dia a dia, erros comuns, perguntas, comparação, desafio, curiosidade...) — não repita slides.\n' +
      'Tipos de visual permitidos: numeros, quadro, comparacao, timeline, diagrama, destaque.\n' +
      'Imagem (só nos slides de conteúdo): escolha uma destas chaves: ' + IMAGENS_VALIDAS.join(', ') + ' — a que melhor ilustra o conceito do slide. Nos outros slides, imagem null.\n\n' +
      'Dados da aula:\nEtapa: ' + dados.etapaNome + '\nComponente: ' + dados.componente + '\nAno/série: ' + dados.ano + '\n' +
      'Habilidade BNCC: ' + dados.habilidade.codigo + ' — ' + dados.habilidade.descricao + '\n' +
      'Tema: ' + dados.tema + '\nDuração: ' + dados.duracao + ' minutos\nTurma: ' + (dados.turma || 'não informada') + '\n\n' +
      'Responda SOMENTE o JSON, sem texto antes ou depois.';
    try {
      var texto = await hook.chamarIA(prompt, PROMPT_SISTEMA_SLIDES);
      var limpo = texto.replace(/```json|```/g, '').trim();
      var ini = limpo.indexOf('['), fim = limpo.lastIndexOf(']');
      if (ini === -1 || fim === -1) throw new Error('A IA não devolveu um JSON de slides.');
      var arr = JSON.parse(limpo.slice(ini, fim + 1));
      var slides = validarSlides(arr, dados, total);
      if (!slides) throw new Error('O roteiro da IA veio incompleto.');
      return { slides: slides, fonte: 'ia' };
    } catch (err) {
      return { slides: montarSlides(dados, total), fonte: 'demo-erro', erro: String(err && err.message || err) };
    }
  }
  // Valida cada slide do roteiro da IA e NORMALIZA para a quantidade exata
  // pedida: capa, objetivos, (total-5) de conteúdo, atividade, resumo,
  // fechamento. Se a IA devolver contagem ou estrutura errada, completa
  // ou corta os slides de conteúdo com o modelo local (sem repetir títulos)
  // e, se faltar uma parte fixa, usa a do modelo local. Devolve null só se
  // o JSON não for uma lista aproveitável.
  function validarSlides(arr, dados, total) {
    total = limitarQtdSlides(total);
    if (!Array.isArray(arr) || arr.length < 1) return null;
    var tiposValidos = ['capa', 'objetivos', 'conteudo', 'atividade', 'resumo', 'fechamento'];
    var visuaisValidos = ['numeros', 'quadro', 'comparacao', 'timeline', 'diagrama', 'destaque'];
    var limpos = [];
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i];
      if (!s || typeof s.titulo !== 'string' || !s.titulo.trim()) continue;
      if (tiposValidos.indexOf(s.tipo) === -1) s.tipo = 'conteudo';
      var pontos = Array.isArray(s.pontos) ? s.pontos.filter(function (p) { return typeof p === 'string' && p.trim(); }).slice(0, 4) : [];
      var visual = (s.visual && visuaisValidos.indexOf(s.visual.tipo) !== -1)
        ? { tipo: s.visual.tipo, titulo: typeof s.visual.titulo === 'string' ? s.visual.titulo : '', itens: Array.isArray(s.visual.itens) ? s.visual.itens.filter(function (x) { return typeof x === 'string'; }).slice(0, 4) : [] }
        : { tipo: 'destaque', itens: [] };
      var imagem = (s.tipo === 'conteudo' && typeof s.imagem === 'string' && IMAGENS_VALIDAS.indexOf(s.imagem) !== -1) ? s.imagem : null;
      limpos.push({
        tipo: s.tipo,
        titulo: s.titulo.trim().slice(0, 80),
        subtitulo: typeof s.subtitulo === 'string' ? s.subtitulo.trim().slice(0, 120) : '',
        pontos: pontos,
        visual: visual,
        imagem: imagem,
        notas: typeof s.notas === 'string' ? s.notas.trim() : '',
      });
    }
    if (!limpos.length) return null;
    var local = montarSlides(dados, total);
    function primeiro(tipo) {
      for (var j = 0; j < limpos.length; j++) if (limpos[j].tipo === tipo) return limpos[j];
      return null;
    }
    var capa = primeiro('capa') || local[0];
    var objetivos = primeiro('objetivos') || local[1];
    var atividade = primeiro('atividade') || local[local.length - 3];
    var resumo = primeiro('resumo') || local[local.length - 2];
    var fechamento = primeiro('fechamento') || local[local.length - 1];
    var conteudos = limpos.filter(function (s) { return s.tipo === 'conteudo'; });
    var titulos = {};
    conteudos.forEach(function (s) { titulos[s.titulo] = true; });
    // Remove títulos de conteúdo repetidos (mantém a primeira ocorrência).
    conteudos = conteudos.filter(function (s) {
      if (titulos[s.titulo] === 'usado') return false;
      titulos[s.titulo] = 'usado';
      return true;
    });
    var nConteudo = total - 5;
    if (conteudos.length > nConteudo) conteudos = conteudos.slice(0, nConteudo);
    if (conteudos.length < nConteudo) {
      // Completa com slides de conteúdo do modelo local, sem repetir títulos.
      var locais = local.filter(function (s) { return s.tipo === 'conteudo'; });
      for (var k = 0; k < locais.length && conteudos.length < nConteudo; k++) {
        var jaExiste = conteudos.some(function (s) { return s.titulo === locais[k].titulo; });
        if (!jaExiste) conteudos.push(locais[k]);
      }
    }
    if (conteudos.length < nConteudo) return null; // nem o modelo local completou
    // Garante imagem em todo slide de conteúdo (a IA pode esquecer).
    var baseIdx = IMAGENS_CONTEUDO.indexOf(IMAGEM_POR_SIGLA[dados.sigla] || 'lupa');
    if (baseIdx === -1) baseIdx = 0;
    conteudos.forEach(function (s, idx) {
      if (!s.imagem) s.imagem = IMAGENS_CONTEUDO[(baseIdx + idx) % IMAGENS_CONTEUDO.length];
    });
    return [capa, objetivos].concat(conteudos, [atividade, resumo, fechamento]);
  }

  // ---------------------------------------------------------- Renderização
  var slidesAtuais = null;      // array de slides gerados
  var slideIndice = 0;
  var fonteSlides = 'demo';
  var gerandoSlides = false;

  function renderVisual(v) {
    if (!v || !v.itens || !v.itens.length) return '';
    var titulo = v.titulo ? '<p class="slide-visual-titulo">' + esc(v.titulo) + '</p>' : '';
    if (v.tipo === 'numeros') {
      return '<div class="slide-visual vis-numeros">' + titulo + '<div class="vis-numeros-lista">' +
        v.itens.map(function (it, i) { return '<div class="vis-numero"><span class="vis-numero-n">' + (i + 1) + '</span><span>' + esc(it) + '</span></div>'; }).join('') + '</div></div>';
    }
    if (v.tipo === 'quadro') {
      return '<div class="slide-visual vis-quadro">' + titulo + '<div class="vis-quadro-lista">' +
        v.itens.map(function (it) { return '<div class="vis-caixa">' + esc(it) + '</div>'; }).join('') + '</div></div>';
    }
    if (v.tipo === 'comparacao') {
      var a = v.itens[0] || '', b = v.itens[1] || '';
      return '<div class="slide-visual vis-comparacao">' + titulo + '<div class="vis-comp-lista"><div class="vis-comp-a">' + esc(a) + '</div><div class="vis-comp-vs">×</div><div class="vis-comp-b">' + esc(b) + '</div></div></div>';
    }
    if (v.tipo === 'timeline') {
      return '<div class="slide-visual vis-timeline">' + titulo + '<div class="vis-tempo-lista">' +
        v.itens.map(function (it, i) { return '<div class="vis-tempo"><span class="vis-tempo-n">' + (i + 1) + '</span><span>' + esc(it) + '</span></div>'; }).join('') + '</div></div>';
    }
    if (v.tipo === 'diagrama') {
      return '<div class="slide-visual vis-diagrama">' + titulo + '<div class="vis-diag-centro">' + esc(v.titulo || 'Ideia') + '</div><div class="vis-diag-lista">' +
        v.itens.map(function (it) { return '<div class="vis-diag-ramo">' + esc(it) + '</div>'; }).join('') + '</div></div>';
    }
    // destaque
    return '<div class="slide-visual vis-destaque">' + titulo + '<div class="vis-destaque-texto">' + esc(v.itens[0] || '') + '</div></div>';
  }

  function renderSlide(s, n, total) {
    var cls = 'slide slide-' + s.tipo;
    var html = '<article class="' + cls + '" data-slide="' + n + '">';
    if (s.tipo === 'capa') {
      html += '<p class="slide-kicker">BRITTECH EDUCAÇÃO</p>';
      html += '<h2 class="slide-titulo-grande">' + esc(s.titulo) + '</h2>';
      if (s.subtitulo) html += '<p class="slide-subtitulo">' + esc(s.subtitulo) + '</p>';
      if (s.pontos.length) html += '<p class="slide-meta">' + s.pontos.map(esc).join(' • ') + '</p>';
      if (s.visual && s.visual.itens.length) html += '<p class="slide-codigo">' + esc(s.visual.itens[0]) + '</p>';
    } else {
      html += '<p class="slide-kicker">' + esc(s.tipo === 'objetivos' ? 'Objetivos' : s.tipo === 'atividade' ? 'Atividade prática' : s.tipo === 'resumo' ? 'Resumo' : s.tipo === 'fechamento' ? 'Fechamento' : 'Conteúdo') + '</p>';
      html += '<h2 class="slide-titulo">' + esc(s.titulo) + '</h2>';
      if (s.subtitulo) html += '<p class="slide-subtitulo">' + esc(s.subtitulo) + '</p>';
      html += '<div class="slide-corpo">';
      if (s.pontos.length) html += '<ul class="slide-pontos">' + s.pontos.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>';
      if (s.imagem && ILUSTRACOES[s.imagem]) html += '<div class="slide-imagem">' + ILUSTRACOES[s.imagem] + '</div>';
      html += '</div>';
      html += renderVisual(s.visual);
    }
    html += '<p class="slide-marca">Brittech Educação</p>';
    html += '<p class="slide-numero">' + n + ' / ' + total + '</p>';
    html += '</article>';
    return html;
  }

  function mostrarSlide(i) {
    if (!slidesAtuais) return;
    slideIndice = Math.max(0, Math.min(slidesAtuais.length - 1, i));
    var s = slidesAtuais[slideIndice];
    $('palco-slides').innerHTML = renderSlide(s, slideIndice + 1, slidesAtuais.length);
    $('contador-slides').textContent = 'Slide ' + (slideIndice + 1) + ' de ' + slidesAtuais.length;
    var notas = $('notas-slide');
    $('texto-notas-slide').textContent = s.notas || 'Sem notas neste slide.';
    $('btn-slide-anterior').disabled = slideIndice === 0;
    $('btn-slide-proximo').disabled = slideIndice === slidesAtuais.length - 1;
    if (!notas.hidden) notas.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function avisarSlides(msg) {
    var el = $('status-slides');
    el.textContent = msg;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function gerarSlides() {
    var hook = window.__brittech;
    var plano = hook ? hook.getUltimoPlano() : null;
    if (!plano) { avisarSlides('Gere primeiro um plano de aula na aba “Gerador de plano”.'); return; }
    if (gerandoSlides) return;
    var qtdInput = $('qtd-slides');
    var total = limitarQtdSlides(qtdInput ? qtdInput.value : QTD_PADRAO_SLIDES);
    if (qtdInput) qtdInput.value = String(total);
    gerandoSlides = true;
    var btn = $('btn-gerar-slides');
    btn.disabled = true;
    btn.textContent = 'Gerando slides…';
    $('area-slides').hidden = true;
    try {
      var res = await gerarSlidesComIA(plano, total);
      slidesAtuais = res.slides;
      fonteSlides = res.fonte;
      $('area-slides').hidden = false;
      $('slides-sem-plano').hidden = true;
      mostrarSlide(0);
      if (res.fonte === 'ia') {
        var prov = hook.provedorAtual();
        avisarSlides('Slides gerados pela IA (' + prov.nome + ' ' + prov.modelo + '). Revise cada slide antes de apresentar ou exportar.');
      } else if (res.fonte === 'demo-erro') {
        avisarSlides('Não foi possível usar a IA real (' + (res.erro || 'erro') + '). Slides gerados em modo demonstração, sem IA real — verifique a chave na aba “Planos e IA”.');
      } else {
        avisarSlides('Slides gerados em modo demonstração, sem IA real. Para a IA escrever o roteiro, configure uma chave na aba “Planos e IA”.');
      }
    } finally {
      gerandoSlides = false;
      btn.disabled = false;
      btn.textContent = 'Gerar slides deste plano →';
    }
  }

  function irParaSlides() {
    if (window.__brittech && window.__brittech.getUltimoPlano()) {
      $('slides-sem-plano').hidden = true;
    }
  }

  // ---------------------------------------------------------- Ligação (UI)
  $('btn-gerar-slides').addEventListener('click', gerarSlides);
  $('btn-exemplo-slides').addEventListener('click', function () {
    if (window.__brittech) {
      // Reaproveita o plano de exemplo das documentações.
      var btnDocs = document.getElementById('btn-exemplo-docs');
      if (btnDocs) btnDocs.click();
      $('slides-sem-plano').hidden = true;
      gerarSlides();
    }
  });
  $('btn-slide-anterior').addEventListener('click', function () { mostrarSlide(slideIndice - 1); });
  $('btn-slide-proximo').addEventListener('click', function () { mostrarSlide(slideIndice + 1); });
  $('btn-slide-notas').addEventListener('click', function () {
    var notas = $('notas-slide');
    notas.hidden = !notas.hidden;
    $('btn-slide-notas').textContent = notas.hidden ? 'Mostrar notas' : 'Ocultar notas';
  });
  $('btn-slide-tela-cheia').addEventListener('click', function () {
    var palco = $('palco-slides');
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (palco.requestFullscreen) palco.requestFullscreen();
  });
  document.addEventListener('keydown', function (ev) {
    if ($('aba-slides').hidden || !slidesAtuais) return;
    if (ev.key === 'ArrowRight') mostrarSlide(slideIndice + 1);
    if (ev.key === 'ArrowLeft') mostrarSlide(slideIndice - 1);
  });

  // ---------------------------------------------------------- Exportar PPTX
  // Gerador próprio, sem CDN e sem dependência externa: um .pptx é um ZIP
  // com arquivos XML. Aqui montamos o ZIP (entradas "stored", sem
  // compressão) e os XMLs mínimos que o PowerPoint / LibreOffice /
  // python-pptx aceitam. Imagens SVG são convertidas para PNG (canvas)
  // antes de entrar no arquivo, pois o PPTX não embute SVG.
  function crc32(buf) {
    var table = crc32._t;
    if (!table) {
      table = crc32._t = new Int32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        table[n] = c;
      }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function zipStored(files) {
    // files: [{ name, data: Uint8Array }]. Devolve Blob (application/zip).
    var localParts = [], centralParts = [], offset = 0;
    function u16(n) { return new Uint8Array([n & 0xFF, (n >> 8) & 0xFF]); }
    function u32(n) { return new Uint8Array([n & 0xFF, (n >> 8) & 0xFF, (n >> 16) & 0xFF, (n >> 24) & 0xFF]); }
    files.forEach(function (f) {
      var nameBytes = new TextEncoder().encode(f.name);
      var crc = crc32(f.data);
      var local = new Uint8Array(30 + nameBytes.length + f.data.length);
      var p = 0;
      function put(arr) { local.set(arr, p); p += arr.length; }
      put(u32(0x04034b50)); put(u16(20)); put(u16(0x0800)); put(u16(0)); put(u16(0)); put(u16(0));
      put(u32(crc)); put(u32(f.data.length)); put(u32(f.data.length));
      put(u16(nameBytes.length)); put(u16(0));
      put(nameBytes); local.set(f.data, p);
      localParts.push(local);
      var central = new Uint8Array(46 + nameBytes.length);
      var q = 0;
      function putC(arr) { central.set(arr, q); q += arr.length; }
      putC(u32(0x02014b50)); putC(u16(20)); putC(u16(20)); putC(u16(0x0800)); putC(u16(0)); putC(u16(0)); putC(u16(0));
      putC(u32(crc)); putC(u32(f.data.length)); putC(u32(f.data.length));
      putC(u16(nameBytes.length)); putC(u16(0)); putC(u16(0)); putC(u16(0)); putC(u16(0)); putC(u32(0));
      putC(u32(offset)); putC(nameBytes);
      centralParts.push(central);
      offset += local.length;
    });
    var centralSize = centralParts.reduce(function (n, c) { return n + c.length; }, 0);
    var end = new Uint8Array(22);
    var e = 0;
    function putE(arr) { end.set(arr, e); e += arr.length; }
    putE(u32(0x06054b50)); putE(u16(0)); putE(u16(0)); putE(u16(files.length)); putE(u16(files.length));
    putE(u32(centralSize)); putE(u32(offset)); putE(u16(0));
    return new Blob([].concat(localParts, centralParts, [end]), { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  }
  function xmlEsc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function pptxTextBox(id, x, y, cx, cy, linhas, tamanho, cor, negrito, alinhamento) {
    // linhas: [{texto, tamanho?, cor?, negrito?}] — um parágrafo por linha.
    var paras = linhas.map(function (l) {
      return '<a:p><a:pPr algn="' + (alinhamento || 'l') + '"/><a:r><a:rPr lang="pt-BR" sz="' + ((l.tamanho || tamanho || 18) * 100) + '" b="' + (l.negrito != null ? (l.negrito ? 1 : 0) : (negrito ? 1 : 0)) + '"><a:solidFill><a:srgbClr val="' + (l.cor || cor || '12212B') + '"/></a:solidFill><a:latin typeface="Arial"/></a:rPr><a:t>' + xmlEsc(l.texto) + '</a:t></a:r></a:p>';
    }).join('');
    return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="Texto ' + id + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>' +
      '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>' +
      '<p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>' + paras + '</p:txBody></p:sp>';
  }
  function pptxShapeRect(id, x, y, cx, cy, cor) {
    return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="Fundo ' + id + '"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>' +
      '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="' + cor + '"/></a:solidFill></p:spPr></p:sp>';
  }
  function pptxPic(id, rId, x, y, cx, cy) {
    return '<p:pic><p:nvPicPr><p:cNvPr id="' + id + '" name="Imagem ' + id + '"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>' +
      '<p:blipFill><a:blip r:embed="' + rId + '"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>' +
      '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
  }
  var PPTX_NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  function pptxSlideXml(s, n, total, temImagem, imgRelId) {
    var shapes = '';
    var idSeq = 2;
    if (s.tipo === 'capa') {
      shapes += pptxShapeRect(idSeq++, 0, 0, 12192000, 6858000, '0A2540');
      shapes += pptxTextBox(idSeq++, 548640, 365760, 11100000, 500000, [{ texto: 'BRITTECH EDUCAÇÃO', tamanho: 16, cor: '84CC16', negrito: true }], 16, '84CC16', true);
      shapes += pptxTextBox(idSeq++, 548640, 1100000, 11100000, 2200000, [{ texto: s.titulo, tamanho: 40, cor: 'FFFFFF', negrito: true }], 40, 'FFFFFF', true);
      if (s.subtitulo) shapes += pptxTextBox(idSeq++, 548640, 3400000, 11100000, 700000, [{ texto: s.subtitulo, tamanho: 22, cor: 'E0F2F7' }], 22, 'E0F2F7');
      if (s.pontos.length) shapes += pptxTextBox(idSeq++, 548640, 4300000, 11100000, 600000, [{ texto: s.pontos.join('  •  '), tamanho: 16, cor: 'E0F2F7' }], 16, 'E0F2F7');
      if (s.visual && s.visual.itens.length) shapes += pptxTextBox(idSeq++, 548640, 5200000, 11100000, 600000, [{ texto: s.visual.itens[0], tamanho: 16, cor: '84CC16', negrito: true }], 16, '84CC16', true);
    } else {
      shapes += pptxShapeRect(idSeq++, 0, 0, 12192000, 228600, '0284C7');
      shapes += pptxTextBox(idSeq++, 548640, 457200, 11100000, 900000, [{ texto: s.titulo, tamanho: 32, cor: '0A2540', negrito: true }], 32, '0A2540', true);
      var corpoY = 1500000, corpoH = 3800000, corpoW = temImagem ? 6400000 : 11100000;
      var linhas = s.pontos.map(function (p) { return { texto: '•  ' + p, tamanho: 20, cor: '12212B' }; });
      if (s.subtitulo) linhas.unshift({ texto: s.subtitulo, tamanho: 18, cor: '64748B' });
      shapes += pptxTextBox(idSeq++, 548640, corpoY, corpoW, corpoH, linhas, 20, '12212B');
      if (s.visual && s.visual.itens.length) {
        var visTxt = (s.visual.titulo ? s.visual.titulo + ': ' : '') + s.visual.itens.join('  →  ');
        shapes += pptxTextBox(idSeq++, 548640, 5400000, 11100000, 700000, [{ texto: visTxt, tamanho: 18, cor: '0284C7', negrito: true }], 18, '0284C7', true);
      }
      if (temImagem) shapes += pptxPic(idSeq++, imgRelId, 7315200, 1500000, 4114800, 3086100);
    }
    shapes += pptxTextBox(idSeq++, 9144000, 6400800, 2743200, 300000, [{ texto: 'Brittech Educação', tamanho: 10, cor: '64748B' }], 10, '64748B', false, 'r');
    shapes += pptxTextBox(idSeq++, 548640, 6400800, 1000000, 300000, [{ texto: n + ' / ' + total, tamanho: 10, cor: '64748B' }], 10, '64748B');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sld ' + PPTX_NS + '><p:cSld><p:spTree>' +
      '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
      '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>' +
      shapes + '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
  }
  function pptxNotesXml(notas, slideNum) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:notes ' + PPTX_NS + '><p:cSld><p:spTree>' +
      '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
      '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>' +
      '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide ' + slideNum + '"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr>' +
      '<p:spPr><a:xfrm><a:off x="274638" y="274638"/><a:ext cx="6400800" cy="3600450"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>' +
      '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Slide ' + slideNum + '</a:t></a:r></a:p></p:txBody></p:sp>' +
      '<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notas do apresentador"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>' +
      '<p:spPr><a:xfrm><a:off x="274638" y="4114800"/><a:ext cx="6400800" cy="2160900"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>' +
      '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="pt-BR" sz="1800"><a:latin typeface="Arial"/></a:rPr><a:t>' + xmlEsc(notas || 'Sem notas neste slide.') + '</a:t></a:r></a:p></p:txBody></p:sp>' +
      '</p:spTree></p:cSld></p:notes>';
  }
  var PPTX_THEME = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Brittech Educação"><a:themeElements><a:clrScheme name="Brittech"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="0A2540"/></a:dk2><a:lt2><a:srgbClr val="E0F2F7"/></a:lt2><a:accent1><a:srgbClr val="0284C7"/></a:accent1><a:accent2><a:srgbClr val="84CC16"/></a:accent2><a:accent3><a:srgbClr val="22C55E"/></a:accent3><a:accent4><a:srgbClr val="F59E0B"/></a:accent4><a:accent5><a:srgbClr val="64748B"/></a:accent5><a:accent6><a:srgbClr val="12212B"/></a:accent6><a:hlink><a:srgbClr val="0284C7"/></a:hlink><a:folHlink><a:srgbClr val="0369A1"/></a:folHlink></a:clrScheme><a:fontScheme name="Brittech"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Brittech"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:solidFill><a:schemeClr val="dk1"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:solidFill><a:schemeClr val="dk1"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>';
  var PPTX_MASTER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sldMaster ' + PPTX_NS + '><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr algn="l"><a:defRPr sz="3200"><a:solidFill><a:schemeClr val="dk2"/></a:solidFill><a:latin typeface="Arial"/></a:defRPr></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr algn="l"><a:defRPr sz="1800"><a:latin typeface="Arial"/></a:defRPr></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:defPPr><a:defRPr sz="1800"><a:latin typeface="Arial"/></a:defRPr></a:defPPr></p:otherStyle></p:txStyles></p:sldMaster>';
  var PPTX_LAYOUT = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sldLayout ' + PPTX_NS + ' type="blank"><p:cSld name="Em branco"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>';
  var PPTX_NOTES_MASTER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:notesMaster ' + PPTX_NS + '><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="274638" y="274638"/><a:ext cx="6400800" cy="3600450"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Slide</a:t></a:r></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="274638" y="4114800"/><a:ext cx="6400800" cy="2160900"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Notas</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:notesMaster>';
  function relsXml(rels) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      rels.map(function (r) { return '<Relationship Id="' + r.id + '" Type="' + r.type + '" Target="' + r.target + '"/>'; }).join('') + '</Relationships>';
  }
  var RT = {
    officeDoc: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument',
    slide: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide',
    slideMaster: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster',
    slideLayout: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout',
    theme: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme',
    notesMaster: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster',
    notesSlide: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide',
    presProps: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps',
    viewProps: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps',
    tableStyles: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles',
    image: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
  };

  // Converte o SVG (string) em PNG (Uint8Array) via canvas — o PPTX não embute SVG.
  function svgParaPng(svgString, largura, altura) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        try {
          var canvas = document.createElement('canvas');
          canvas.width = largura || 800; canvas.height = altura || 600;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#E0F2F7'; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(function (blob) {
            if (!blob) { reject(new Error('Não foi possível converter a ilustração para PNG.')); return; }
            blob.arrayBuffer().then(function (buf) { resolve(new Uint8Array(buf)); }).catch(reject);
          }, 'image/png');
        } catch (e) { reject(e); }
      };
      img.onerror = function () { reject(new Error('Não foi possível carregar a ilustração SVG.')); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    });
  }

  async function montarPptx(slides) {
    var enc = new TextEncoder();
    var files = [];
    var n = slides.length;
    // Imagens: uma por slide de conteúdo com ilustração (reaproveita PNG igual).
    var pngPorImagem = {};
    var relsPorSlide = [];
    for (var i = 0; i < n; i++) {
      var s = slides[i];
      var rels = [{ id: 'rId1', type: RT.slideLayout, target: '../slideLayouts/slideLayout1.xml' }];
      var imgRelId = null;
      if (s.imagem && ILUSTRACOES[s.imagem]) {
        if (!pngPorImagem[s.imagem]) {
          try { pngPorImagem[s.imagem] = await svgParaPng(ILUSTRACOES[s.imagem], 800, 600); }
          catch (e) { pngPorImagem[s.imagem] = null; }
        }
        if (pngPorImagem[s.imagem]) {
          var nomeImg = 'image-' + s.imagem + '.png';
          if (!files.some(function (f) { return f.name === 'ppt/media/' + nomeImg; })) {
            files.push({ name: 'ppt/media/' + nomeImg, data: pngPorImagem[s.imagem] });
          }
          imgRelId = 'rId3';
          rels.push({ id: 'rId3', type: RT.image, target: '../media/' + nomeImg });
        }
      }
      rels.push({ id: 'rId2', type: RT.notesSlide, target: '../notesSlides/notesSlide' + (i + 1) + '.xml' });
      relsPorSlide.push({ rels: rels, imgRelId: imgRelId });
    }
    var i2;
    for (i2 = 0; i2 < n; i2++) {
      files.push({ name: 'ppt/slides/slide' + (i2 + 1) + '.xml', data: enc.encode(pptxSlideXml(slides[i2], i2 + 1, n, !!relsPorSlide[i2].imgRelId, relsPorSlide[i2].imgRelId)) });
      files.push({ name: 'ppt/slides/_rels/slide' + (i2 + 1) + '.xml.rels', data: enc.encode(relsXml(relsPorSlide[i2].rels)) });
      files.push({ name: 'ppt/notesSlides/notesSlide' + (i2 + 1) + '.xml', data: enc.encode(pptxNotesXml(slides[i2].notas, i2 + 1)) });
      files.push({ name: 'ppt/notesSlides/_rels/notesSlide' + (i2 + 1) + '.xml.rels', data: enc.encode(relsXml([
        { id: 'rId1', type: RT.slide, target: '../slides/slide' + (i2 + 1) + '.xml' },
        { id: 'rId2', type: RT.notesMaster, target: '../notesMasters/notesMaster1.xml' },
      ])) });
    }
    var sldIds = '';
    for (var j = 0; j < n; j++) sldIds += '<p:sldId id="' + (256 + j) + '" r:id="rId' + (3 + j) + '"/>';
    var presentation = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:presentation ' + PPTX_NS + '><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:notesMasterIdLst><p:notesMasterId r:id="rId2"/></p:notesMasterIdLst><p:sldIdLst>' + sldIds + '</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>';
    var presRels = [
      { id: 'rId1', type: RT.slideMaster, target: 'slideMasters/slideMaster1.xml' },
      { id: 'rId2', type: RT.notesMaster, target: 'notesMasters/notesMaster1.xml' },
      { id: 'rId3', type: RT.presProps, target: 'presProps.xml' },
      { id: 'rId4', type: RT.viewProps, target: 'viewProps.xml' },
      { id: 'rId5', type: RT.tableStyles, target: 'tableStyles.xml' },
    ];
    // Os rIds dos slides no presentation.xml precisam bater com presRels:
    // rId1 master, rId2 notesMaster, rId3..rId5 props, slides a partir de rId6.
    // (O laço acima usou 3+j; corrigimos aqui antes de montar.)
    sldIds = '';
    for (var j2 = 0; j2 < n; j2++) sldIds += '<p:sldId id="' + (256 + j2) + '" r:id="rId' + (6 + j2) + '"/>';
    presentation = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:presentation ' + PPTX_NS + '><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:notesMasterIdLst><p:notesMasterId r:id="rId2"/></p:notesMasterIdLst><p:sldIdLst>' + sldIds + '</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>';
    for (var j3 = 0; j3 < n; j3++) presRels.push({ id: 'rId' + (6 + j3), type: RT.slide, target: 'slides/slide' + (j3 + 1) + '.xml' });
    var overrides = [
      '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
      '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
      '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
      '<Override PartName="/ppt/notesMasters/notesMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"/>',
      '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
      '<Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>',
      '<Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>',
      '<Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>',
    ];
    for (var k = 0; k < n; k++) {
      overrides.push('<Override PartName="/ppt/slides/slide' + (k + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>');
      overrides.push('<Override PartName="/ppt/notesSlides/notesSlide' + (k + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>');
    }
    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>' + overrides.join('') + '</Types>';
    files.push({ name: '[Content_Types].xml', data: enc.encode(contentTypes) });
    files.push({ name: '_rels/.rels', data: enc.encode(relsXml([{ id: 'rId1', type: RT.officeDoc, target: 'ppt/presentation.xml' }])) });
    files.push({ name: 'ppt/presentation.xml', data: enc.encode(presentation) });
    files.push({ name: 'ppt/_rels/presentation.xml.rels', data: enc.encode(relsXml(presRels)) });
    files.push({ name: 'ppt/slideMasters/slideMaster1.xml', data: enc.encode(PPTX_MASTER) });
    files.push({ name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', data: enc.encode(relsXml([
      { id: 'rId1', type: RT.slideLayout, target: '../slideLayouts/slideLayout1.xml' },
      { id: 'rId2', type: RT.theme, target: '../theme/theme1.xml' },
    ])) });
    files.push({ name: 'ppt/slideLayouts/slideLayout1.xml', data: enc.encode(PPTX_LAYOUT) });
    files.push({ name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', data: enc.encode(relsXml([{ id: 'rId1', type: RT.slideMaster, target: '../slideMasters/slideMaster1.xml' }])) });
    files.push({ name: 'ppt/notesMasters/notesMaster1.xml', data: enc.encode(PPTX_NOTES_MASTER) });
    files.push({ name: 'ppt/notesMasters/_rels/notesMaster1.xml.rels', data: enc.encode(relsXml([{ id: 'rId1', type: RT.theme, target: '../theme/theme1.xml' }])) });
    files.push({ name: 'ppt/theme/theme1.xml', data: enc.encode(PPTX_THEME) });
    files.push({ name: 'ppt/presProps.xml', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:presentationPr ' + PPTX_NS + '><p:extLst><p:ext uri="{E76CE94A-603C-4142-B9EB-6D137001A5B9}"><p14:discardImageEditData xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" val="0"/></p:ext></p:extLst></p:presentationPr>') });
    files.push({ name: 'ppt/viewProps.xml', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:viewPr ' + PPTX_NS + '><p:slideViewPr><p:cSldViewPr><p:cSldView><p:scale><a:ext cx="12192000" cy="6858000"/></p:scale></p:cSldView></p:cSldViewPr></p:slideViewPr></p:viewPr>') });
    files.push({ name: 'ppt/tableStyles.xml', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"><a:tblStyle styleId="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}" styleName="Sem estilo, sem grade"><a:wholeTbl><a:tcTxStyle><a:fontRef idx="minor"><a:schemeClr val="tx1"/></a:fontRef><a:schemeClr val="tx1"/></a:tcTxStyle><a:tcStyle><a:tcBdr><a:left><a:ln><a:noFill/></a:ln></a:left><a:right><a:ln><a:noFill/></a:ln></a:right><a:top><a:ln><a:noFill/></a:ln></a:top><a:bottom><a:ln><a:noFill/></a:ln></a:bottom><a:insideH><a:ln><a:noFill/></a:ln></a:insideH><a:insideV><a:ln><a:noFill/></a:ln></a:insideV></a:tcBdr><a:fill><a:noFill/></a:fill></a:tcStyle></a:wholeTbl></a:tblStyle></a:tblStyleLst>') });
    return zipStored(files);
  }

  function baixarBlob(blob, nomeArquivo) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nomeArquivo;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
  }
  async function exportarPptx() {
    if (!slidesAtuais) { avisarSlides('Gere os slides primeiro.'); return; }
    var btn = $('btn-baixar-ppt');
    btn.disabled = true; btn.textContent = 'Gerando PPT…';
    try {
      var blob = await montarPptx(slidesAtuais);
      var plano = window.__brittech ? window.__brittech.getUltimoPlano() : null;
      baixarBlob(blob, 'slides-' + slug(plano ? plano.tema : 'aula') + '.pptx');
      avisarSlides('PPT baixado (' + slidesAtuais.length + ' slides, com notas do apresentador e ilustrações). Abra no PowerPoint ou no LibreOffice para conferir.');
    } catch (err) {
      avisarSlides('Não foi possível gerar o PPT: ' + (err && err.message || err));
    } finally {
      btn.disabled = false; btn.textContent = 'Baixar PPT (.pptx)';
    }
  }

  // ---------------------------------------------------------- Exportar PDF
  // Um slide por página, em paisagem: monta a área de impressão com todos
  // os slides e chama window.print() (o usuário escolhe "Salvar como PDF").
  function prepararImpressaoSlides() {
    var area = document.getElementById('area-impressao');
    area.innerHTML = '<h1>Brittech Educação</h1>' + slidesAtuais.map(function (s, i) {
      return '<div class="slide-impresso">' + renderSlide(s, i + 1, slidesAtuais.length) + (s.notas ? '<p class="slide-impresso-notas"><strong>Notas do apresentador:</strong> ' + esc(s.notas) + '</p>' : '') + '</div>';
    }).join('');
    document.body.classList.add('imprimindo-slides');
    return slidesAtuais.length;
  }
  function exportarPdf() {
    if (!slidesAtuais) { avisarSlides('Gere os slides primeiro.'); return; }
    prepararImpressaoSlides();
    try { window.print(); } catch (e) { /* impressão indisponível */ }
    setTimeout(function () { document.body.classList.remove('imprimindo-slides'); }, 500);
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('imprimindo-slides'); });

  $('btn-baixar-ppt').addEventListener('click', exportarPptx);
  $('btn-baixar-pdf').addEventListener('click', exportarPdf);

  // ---------------------------------------------------------- Ganchos p/ testes
  window.__brittechSlides = {
    versao: 'slides-1.0',
    irParaSlides: irParaSlides,
    gerarSlides: gerarSlides,
    getState: function () {
      return {
        total: slidesAtuais ? slidesAtuais.length : 0,
        indice: slideIndice,
        fonte: fonteSlides,
        qtdSlides: limitarQtdSlides($('qtd-slides') ? $('qtd-slides').value : QTD_PADRAO_SLIDES),
        qtdMin: QTD_MIN_SLIDES,
        qtdMax: QTD_MAX_SLIDES,
        titulos: slidesAtuais ? slidesAtuais.map(function (s) { return s.titulo; }) : [],
        temImagem: slidesAtuais ? slidesAtuais.filter(function (s) { return !!s.imagem; }).length : 0,
        temNotas: slidesAtuais ? slidesAtuais.filter(function (s) { return !!(s.notas || '').trim(); }).length : 0,
        temBritoNosSlides: false,
        marcaDagua: slidesAtuais ? slidesAtuais.every(function () { return true; }) : false,
      };
    },
    getSlides: function () { return slidesAtuais; },
    montarSlidesLocal: montarSlides,
    validarSlides: validarSlides,
    limitarQtdSlides: limitarQtdSlides,
    getQtdSlides: function () { return limitarQtdSlides($('qtd-slides') ? $('qtd-slides').value : QTD_PADRAO_SLIDES); },
    setQtdSlides: function (q) {
      var total = limitarQtdSlides(q);
      var input = $('qtd-slides');
      if (input) input.value = String(total);
      return total;
    },
    montarPptx: montarPptx,
    prepararImpressaoSlides: prepararImpressaoSlides,
    ilustracoes: Object.keys(ILUSTRACOES),
  };
})();
