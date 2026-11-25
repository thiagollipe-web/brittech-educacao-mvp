// Brittech Educação — Modo Aluno (Estudar com IA)
// Nova aba "Estudar com IA": o aluno informa o tema e cola o conteúdo da
// aula/apostila e escolhe o formato — "Aula simulada" (padrão) ou "Aula de
// estudo". Na aula simulada, o professor explica e três colegas virtuais
// (Curioso, Anotador e Pensador) perguntam e resumem, como numa sala de
// aula; na aula de estudo, a IA monta explicação em passos curtos e
// perguntas de revisão. Nos dois formatos, um quiz de 5 questões de múltipla
// escolha, com correção e nota, e um resumo para o professor.
// Usa o mesmo motor de IA do planejador (chamarIA / modoIA em app.js):
// com IA real ativa, a aula é escrita sob medida pela IA; sem IA (ou se a
// IA falhar), cai para um modelo local de demonstração, com aviso visível
// "modo demonstração". Sem login, sem banco de dados, sem envio por e-mail:
// o resumo para o professor é só um texto para copiar.

var aulaEstudo = null; // { tema, nome, fonte, modo, dialogo, explicacao, revisao, quiz, acertos, erros }
var gerandoEstudo = false;
var modoEstudo = 'simulada'; // 'simulada' (padrão) ou 'estudo'

// Personagens da aula simulada (ideia inspirada no OpenMAIC, licença MIT —
// só o conceito: professor + colegas com papéis distintos; o código e os
// textos são nossos). Avatar = círculo colorido com a inicial.
var PERSONAGENS = {
  professor: { nome: 'Professor', cor: '#3b82f6', inicial: 'Pr' },
  curioso: { nome: 'Curioso', cor: '#ec4899', inicial: 'Cu' },
  anotador: { nome: 'Anotador', cor: '#06b6d4', inicial: 'An' },
  pensador: { nome: 'Pensador', cor: '#f59e0b', inicial: 'Pe' },
};

// Exemplo real da biblioteca gratuita de aulas: "Misturas homogêneas e
// heterogêneas no dia a dia" (Ciências, 6º ano, habilidade BNCC EF06CI01 —
// água e sal, água e óleo, água e areia). Texto de estudo baseado no tema
// dessa aula; não é citação literal do arquivo da aula.
var EXEMPLO_ESTUDO_TEMA = 'Misturas homogêneas e heterogêneas';
var EXEMPLO_ESTUDO_TEXTO = 'Uma mistura é a junção de dois ou mais materiais. Quando não conseguimos distinguir os componentes da mistura, como na água com sal dissolvido, a mistura é homogênea. Quando conseguimos ver os componentes separados, como na água com óleo ou na água com areia, a mistura é heterogênea. No dia a dia encontramos misturas em muitos lugares: o suco, o ar que respiramos e a salada são exemplos de misturas. Para classificar uma mistura, observamos se dá para ver os componentes separados ou se eles formam uma coisa só.';

var PROMPT_SISTEMA_ESTUDO = 'Você é um professor brasileiro que explica para alunos da educação básica. Use linguagem simples e direta, com exemplos do dia a dia. Responda sempre em português.';

function promptEstudo(tema, texto) {
  var prompt = 'Monte uma aula de estudo para um aluno sobre o tema abaixo.\n\nTema: ' + tema + '\n';
  if (texto) prompt += 'Conteúdo da aula/apostila do aluno:\n---\n' + texto.slice(0, 6000) + '\n---\n';
  prompt += 'Devolva SOMENTE um objeto JSON válido, sem markdown e sem ```, exatamente com esta estrutura:\n' +
    '{\n' +
    '  "explicacao": [{"titulo": "título curto do passo", "texto": "explicação curta e clara"}],\n' +
    '  "revisao": [{"pergunta": "pergunta de revisão", "resposta": "resposta curta"}],\n' +
    '  "quiz": [{"pergunta": "pergunta", "alternativas": ["alternativa A", "alternativa B", "alternativa C", "alternativa D"], "correta": 0, "explicacao": "por que essa é a certa, em uma frase"}]\n' +
    '}\n\n' +
    'Regras:\n' +
    '- explicacao: 4 a 6 passos curtos, em linguagem de aluno, com exemplos do dia a dia. Use SÓ o conteúdo informado (e o tema, se não houver conteúdo).\n' +
    '- revisao: exatamente 5 perguntas, com respostas curtas.\n' +
    '- quiz: exatamente 5 questões de múltipla escolha, 4 alternativas cada, só uma certa; "correta" é o índice (0 a 3) da alternativa certa. Varie a posição da resposta certa entre as questões.\n' +
    '- Não invente fatos, nomes, datas ou números que não estejam no conteúdo informado.';
  return prompt;
}

// Extrai e valida o JSON devolvido pela IA. Lança erro se vier inválido —
// quem chama cai para o modelo local de demonstração.
function extrairJSONAula(texto) {
  var ini = texto.indexOf('{'), fim = texto.lastIndexOf('}');
  if (ini < 0 || fim <= ini) throw new Error('A IA não devolveu um JSON válido.');
  var obj = JSON.parse(texto.slice(ini, fim + 1));
  if (!Array.isArray(obj.explicacao) || !obj.explicacao.length) throw new Error('JSON da IA sem explicação.');
  if (!Array.isArray(obj.revisao) || !obj.revisao.length) throw new Error('JSON da IA sem revisão.');
  if (!Array.isArray(obj.quiz) || !obj.quiz.length) throw new Error('JSON da IA sem quiz.');
  obj.quiz.forEach(function (q, i) {
    if (!Array.isArray(q.alternativas) || q.alternativas.length !== 4) throw new Error('Questão ' + (i + 1) + ' do quiz sem 4 alternativas.');
    if (typeof q.correta !== 'number' || q.correta < 0 || q.correta > 3) throw new Error('Questão ' + (i + 1) + ' do quiz sem resposta certa válida.');
  });
  return obj;
}

// ---------------------------------------------------------------- Aula simulada (IA)
// Uma única chamada: a IA devolve o diálogo da aula simulada + revisão +
// quiz, tudo no mesmo JSON. O diálogo é uma conversa: o professor explica
// em falas curtas e os três colegas virtuais perguntam e resumem entre as
// explicações, como numa sala de aula.
function promptAulaSimulada(tema, texto) {
  var prompt = 'Monte uma aula simulada para um aluno sobre o tema abaixo, como uma conversa numa sala de aula virtual.\n\nTema: ' + tema + '\n';
  if (texto) prompt += 'Conteúdo da aula/apostila do aluno:\n---\n' + texto.slice(0, 6000) + '\n---\n';
  prompt += 'Devolva SOMENTE um objeto JSON válido, sem markdown e sem ```, exatamente com esta estrutura:\n' +
    '{\n' +
    '  "dialogo": [{"personagem": "professor", "texto": "fala curta", "chave": "ponto-chave curto ou null"}, ...],\n' +
    '  "revisao": [{"pergunta": "pergunta de revisão", "resposta": "resposta curta"}],\n' +
    '  "quiz": [{"pergunta": "pergunta", "alternativas": ["alternativa A", "alternativa B", "alternativa C", "alternativa D"], "correta": 0, "explicacao": "por que essa é a certa, em uma frase"}]\n' +
    '}\n\n' +
    'Personagens (use só estes):\n' +
    '- professor: explica o tema em 4 a 6 falas curtas (máx. 2 frases cada), em linguagem de aluno, com exemplos do dia a dia. Cada fala do professor traz "chave" com o ponto-chave daquela fala, em poucas palavras.\n' +
    '- curioso: um colega que pergunta "por quê?" ou "como isso funciona?" — 2 falas curtas, sempre ligadas ao que o professor acabou de explicar.\n' +
    '- anotador: um colega que resume o ponto em 1 frase — 2 falas curtas.\n' +
    '- pensador: um colega que conecta o tema com outro assunto do dia a dia ou questiona com "e se...?" — 1 fala curta.\n' +
    'Ordem: comece com o professor, intercale as perguntas e os resumos dos colegas entre as explicações e termine com o professor. Total: 10 a 14 falas.\n\n' +
    'Regras:\n' +
    '- revisao: exatamente 5 perguntas, com respostas curtas.\n' +
    '- quiz: exatamente 5 questões de múltipla escolha, 4 alternativas cada, só uma certa; "correta" é o índice (0 a 3) da alternativa certa. Varie a posição da resposta certa entre as questões.\n' +
    '- Use SÓ o conteúdo informado (e o tema, se não houver conteúdo). Não invente fatos, nomes, datas ou números que não estejam no conteúdo informado.';
  return prompt;
}

var PERSONAGENS_VALIDOS = ['professor', 'curioso', 'anotador', 'pensador'];

// Extrai e valida o JSON da aula simulada. Lança erro se vier inválido —
// quem chama cai para o modelo local de demonstração.
function extrairJSONAulaSimulada(texto) {
  var ini = texto.indexOf('{'), fim = texto.lastIndexOf('}');
  if (ini < 0 || fim <= ini) throw new Error('A IA não devolveu um JSON válido.');
  var obj = JSON.parse(texto.slice(ini, fim + 1));
  if (!Array.isArray(obj.dialogo) || obj.dialogo.length < 6) throw new Error('JSON da IA sem diálogo de aula simulada.');
  obj.dialogo.forEach(function (f, i) {
    if (PERSONAGENS_VALIDOS.indexOf(f.personagem) < 0) throw new Error('Fala ' + (i + 1) + ' do diálogo com personagem inválido.');
    if (typeof f.texto !== 'string' || !f.texto.trim()) throw new Error('Fala ' + (i + 1) + ' do diálogo sem texto.');
    f.texto = f.texto.trim().slice(0, 400);
    if (typeof f.chave !== 'string') f.chave = null;
    else f.chave = f.chave.trim().slice(0, 120) || null;
  });
  if (!Array.isArray(obj.revisao) || !obj.revisao.length) throw new Error('JSON da IA sem revisão.');
  if (!Array.isArray(obj.quiz) || !obj.quiz.length) throw new Error('JSON da IA sem quiz.');
  obj.quiz.forEach(function (q, i) {
    if (!Array.isArray(q.alternativas) || q.alternativas.length !== 4) throw new Error('Questão ' + (i + 1) + ' do quiz sem 4 alternativas.');
    if (typeof q.correta !== 'number' || q.correta < 0 || q.correta > 3) throw new Error('Questão ' + (i + 1) + ' do quiz sem resposta certa válida.');
  });
  return obj;
}

// ---------------------------------------------------------------- Modelo local (demonstração)
// Monta a aula a partir do texto colado pelo aluno: divide o texto em
// passos (2 frases cada), gera perguntas de revisão sobre cada passo e um
// quiz cujas alternativas certas são frases do próprio material. Sem texto
// colado, usa passos genéricos de estudo sobre o tema — e o aviso na tela
// deixa claro que é um modelo de exemplo.
function frasesDe(texto) {
  return String(texto || '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 3; });
}
function primeiraFrase(texto) {
  var f = frasesDe(texto);
  return f.length ? f[0] : texto;
}
function embaralharComIndice(arr) {
  var ordem = arr.map(function (_, i) { return i; });
  for (var i = ordem.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = ordem[i]; ordem[i] = ordem[j]; ordem[j] = t;
  }
  return ordem;
}
function quizDePassos(passos) {
  var qs = [];
  for (var i = 0; i < passos.length && qs.length < 5; i++) {
    var p = passos[i];
    var certa = primeiraFrase(p.texto);
    var outro = passos.length > 1 ? passos[(i + 1) % passos.length] : null;
    var distratorOutro = outro ? primeiraFrase(outro.texto) : 'Isso é o contrário do que o material diz.';
    if (distratorOutro === certa) distratorOutro = 'Isso é o contrário do que o material diz.';
    var alts = [certa, 'O material não fala sobre isso.', distratorOutro, 'Nenhuma das alternativas anteriores.'];
    var ordem = embaralharComIndice(alts);
    var alternativas = ordem.map(function (j) { return alts[j]; });
    qs.push({
      pergunta: 'O que o material diz sobre "' + p.titulo + '"?',
      alternativas: alternativas,
      correta: ordem.indexOf(0),
      explicacao: 'A resposta certa é a frase do próprio material sobre esse passo.',
    });
  }
  return qs;
}
function montarAulaDemo(tema, texto) {
  var frases = frasesDe(texto);
  var passos = [];
  if (frases.length) {
    for (var i = 0; i < frases.length && passos.length < 5; i += 2) {
      var grupo = frases.slice(i, i + 2);
      var palavras = grupo[0].replace(/[.!?]$/, '').split(' ');
      var titulo = palavras.slice(0, 5).join(' ') + (palavras.length > 5 ? '…' : '');
      passos.push({ titulo: titulo.charAt(0).toUpperCase() + titulo.slice(1), texto: grupo.join(' ') });
    }
  } else {
    passos = [
      { titulo: 'O que é ' + tema, texto: 'Comece pelo básico: o que significa ' + tema + ' e onde esse assunto aparece no seu dia a dia.' },
      { titulo: 'Por que isso importa', texto: 'Entender ' + tema + ' ajuda a resolver as questões da prova e a explicar o assunto com suas próprias palavras.' },
      { titulo: 'Exemplos do dia a dia', texto: 'Procure 3 exemplos de ' + tema + ' na sua casa, na rua ou na escola e anote o que eles têm em comum.' },
      { titulo: 'O que costuma cair', texto: 'Revise as definições e os exemplos principais de ' + tema + ' — são eles que mais aparecem nas questões.' },
      { titulo: 'Como revisar', texto: 'Depois de ler os passos, responda às perguntas de revisão sem olhar e faça o quiz abaixo.' },
    ];
  }
  // Completa até 5 passos com dicas de estudo sobre o tema, para que a
  // revisão e o quiz tenham sempre 5 itens (o que o texto colado rendeu
  // fica nos primeiros passos).
  var extras = [
    { titulo: 'Exemplos do dia a dia', texto: 'Procure exemplos de ' + tema + ' na sua casa, na rua ou na escola e anote o que eles têm em comum.' },
    { titulo: 'Como revisar', texto: 'Depois de ler os passos, responda às perguntas de revisão sem olhar e faça o quiz abaixo.' },
    { titulo: 'O que costuma cair', texto: 'Revise as definições e os exemplos principais de ' + tema + ' — são eles que mais aparecem nas questões.' },
    { titulo: 'Como testar o que aprendeu', texto: 'Responda às perguntas de revisão sem olhar o texto e faça o quiz abaixo para ver o que já ficou na memória.' },
    { titulo: 'Ligando com o que você já sabe', texto: 'Pense onde ' + tema + ' aparece em outras matérias ou no seu dia a dia — ligar o assunto com o que você já conhece ajuda a lembrar.' },
  ];
  for (var e = 0; e < extras.length && passos.length < 5; e++) passos.push(extras[e]);
  var revisao = passos.map(function (p) {
    return { pergunta: 'O que o material diz sobre "' + p.titulo + '"? Explique com suas palavras.', resposta: p.texto };
  });
  return { explicacao: passos, revisao: revisao.slice(0, 5), quiz: quizDePassos(passos) };
}

// ---------------------------------------------------------------- Diálogo local (demonstração)
// Monta o diálogo da aula simulada a partir dos passos do modelo local:
// cada passo vira uma fala do professor (o título é o ponto-chave) e os
// colegas entram entre as explicações — o Curioso pergunta, o Anotador
// resume a frase do próprio material e o Pensador conecta com o dia a dia.
// Nada é inventado fora do tema e do texto colado pelo aluno.
function montarDialogoDemo(tema, passos) {
  var dialogo = [];
  var perguntasCurioso = [
    'Mas por que isso acontece?',
    'E como a gente percebe isso no dia a dia?',
  ];
  var perguntaPensador = 'Isso tem a ver com alguma coisa que a gente já viu em outra matéria ou no dia a dia?';
  passos.forEach(function (p, i) {
    dialogo.push({ personagem: 'professor', texto: p.texto, chave: p.titulo });
    if (i === 0) dialogo.push({ personagem: 'curioso', texto: perguntasCurioso[0], chave: null });
    if (i === 1) dialogo.push({ personagem: 'anotador', texto: 'Resumindo: ' + primeiraFrase(p.texto), chave: null });
    if (i === 2) dialogo.push({ personagem: 'pensador', texto: perguntaPensador, chave: null });
    if (i === 3) dialogo.push({ personagem: 'curioso', texto: perguntasCurioso[1], chave: null });
    if (i === 4) dialogo.push({ personagem: 'anotador', texto: 'Resumindo: ' + primeiraFrase(p.texto), chave: null });
  });
  return dialogo;
}

// ---------------------------------------------------------------- Geração (IA ou demonstração)
async function gerarAulaEstudo() {
  var tema = $('estudo-tema').value.trim();
  var texto = $('estudo-texto').value.trim();
  var nome = $('estudo-nome').value.trim();
  if (!tema) { avisar('Escreva o tema do estudo antes de gerar a aula.'); $('estudo-tema').focus(); return; }
  if (gerandoEstudo) return;
  gerandoEstudo = true;
  var btn = $('btn-gerar-estudo');
  btn.disabled = true; btn.textContent = 'Gerando aula…';
  $('estudo-aviso-modo').hidden = true;
  $('estudo-resultado').hidden = true;
  var fonte = 'demo', dados = null, erroIA = null, dialogo = null;
  var simulada = modoEstudo === 'simulada';
  if (modoIA() !== 'demo') {
    try {
      if (simulada) {
        var respS = await chamarIA(promptAulaSimulada(tema, texto) + obterContextoDrive(), PROMPT_SISTEMA_ESTUDO);
        dados = extrairJSONAulaSimulada(respS);
        dialogo = dados.dialogo;
        // Passos derivados das falas do professor, para o estado ficar
        // completo igual ao modo de estudo (o diálogo é o que aparece).
        dados.explicacao = dialogo.filter(function (f) { return f.personagem === 'professor'; }).map(function (f) {
          return { titulo: f.chave || 'Ponto da aula', texto: f.texto };
        });
      } else {
        var resp = await chamarIA(promptEstudo(tema, texto) + obterContextoDrive(), PROMPT_SISTEMA_ESTUDO);
        dados = extrairJSONAula(resp);
      }
      fonte = 'ia';
    } catch (err) { erroIA = err; }
  }
  if (!dados) {
    dados = montarAulaDemo(tema, texto);
    fonte = erroIA ? 'demo-erro' : 'demo';
  }
  if (simulada && !dialogo) dialogo = montarDialogoDemo(tema, dados.explicacao);
  aulaEstudo = {
    tema: tema, nome: nome, fonte: fonte, modo: modoEstudo, dialogo: dialogo,
    explicacao: dados.explicacao, revisao: dados.revisao.slice(0, 5), quiz: dados.quiz.slice(0, 5),
    acertos: null, erros: [],
  };
  renderizarAulaEstudo(erroIA);
  $('estudo-resultado').hidden = false;
  $('estudo-resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  btn.disabled = false; btn.textContent = textoBotaoGerar();
  gerandoEstudo = false;
}

function renderizarAulaEstudo(erroIA) {
  var a = aulaEstudo;
  var simulada = a.modo === 'simulada';
  var aviso = $('estudo-aviso-modo');
  aviso.hidden = false;
  if (a.fonte === 'ia') {
    aviso.classList.add('ia-ativa');
    aviso.innerHTML = '<strong>Aula ' + (simulada ? 'simulada ' : '') + 'gerada pela IA real (' + esc(provedorAtual().nome) + ' ' + esc(provedorAtual().modelo) + ').</strong> Revise ' + (simulada ? 'o diálogo e ' : '') + 'as questões antes de estudar — a IA pode errar.';
  } else {
    aviso.classList.remove('ia-ativa');
    aviso.innerHTML = '<strong>Modo demonstração, sem IA real.</strong> Esta aula ' + (simulada ? 'simulada ' : '') + 'foi montada a partir de um modelo de exemplo com o texto que você colou — ' + (simulada ? 'o diálogo é de exemplo' : 'as perguntas são de exemplo') + '. Para a IA escrever a aula sob medida, configure a chave na aba “Planos e IA”.' +
      (erroIA ? ' (A IA não respondeu: ' + esc(erroIA.message || erroIA) + '.)' : '');
  }
  $('estudo-titulo').textContent = 'Sua aula: ' + a.tema;
  // Aula simulada mostra o diálogo no lugar dos passos; aula de estudo
  // mostra os passos no lugar do diálogo. Revisão, quiz e resumo são iguais.
  $('estudo-titulo-passos').hidden = simulada;
  $('estudo-passos').hidden = simulada;
  $('estudo-titulo-dialogo').hidden = !simulada;
  $('estudo-dialogo').hidden = !simulada;
  if (simulada) {
    $('estudo-dialogo').innerHTML = (a.dialogo || []).map(function (f) {
      var p = PERSONAGENS[f.personagem] || PERSONAGENS.professor;
      return '<div class="dialogo-fala">' +
        '<span class="dialogo-avatar" style="background:' + p.cor + '" aria-hidden="true">' + p.inicial + '</span>' +
        '<div class="dialogo-bolha"><p class="dialogo-nome" style="color:' + p.cor + '">' + p.nome + '</p>' +
        '<p>' + esc(f.texto) + '</p>' +
        (f.chave ? '<p class="dialogo-chave">Ponto-chave: <strong>' + esc(f.chave) + '</strong></p>' : '') +
        '</div></div>';
    }).join('');
  }
  $('estudo-passos').innerHTML = a.explicacao.map(function (p) {
    return '<li><h4>' + esc(p.titulo) + '</h4><p>' + esc(p.texto) + '</p></li>';
  }).join('');
  $('estudo-revisao').innerHTML = a.revisao.map(function (r, i) {
    return '<details class="estudo-revisao"><summary>' + (i + 1) + '. ' + esc(r.pergunta) + '</summary><p>' + esc(r.resposta) + '</p></details>';
  }).join('');
  $('estudo-quiz').innerHTML = a.quiz.map(function (q, i) {
    return '<div class="estudo-questao" data-questao="' + i + '">' +
      '<p>' + (i + 1) + '. ' + esc(q.pergunta) + '</p>' +
      q.alternativas.map(function (alt, j) {
        return '<label><input type="radio" name="estudo-q' + i + '" value="' + j + '"> ' + esc(alt) + '</label>';
      }).join('') +
      '<p class="feedback" hidden></p></div>';
  }).join('');
  $('estudo-nota').hidden = true;
  $('estudo-nota').classList.remove('nota-boa');
  $('btn-refazer-quiz').hidden = true;
  $('estudo-resumo').textContent = montarResumoEstudo();
}

// ---------------------------------------------------------------- Quiz: correção e nota
function corrigirQuiz() {
  if (!aulaEstudo) { avisar('Gere primeiro uma aula de estudo.'); return; }
  var total = aulaEstudo.quiz.length, acertos = 0, erros = [];
  aulaEstudo.quiz.forEach(function (q, i) {
    var escolhido = document.querySelector('input[name="estudo-q' + i + '"]:checked');
    var bloco = document.querySelector('[data-questao="' + i + '"]');
    var idx = escolhido ? Number(escolhido.value) : -1;
    var certa = idx === q.correta;
    if (certa) acertos++; else erros.push(i + 1);
    bloco.classList.remove('certa', 'errada');
    bloco.classList.add(certa ? 'certa' : 'errada');
    bloco.querySelectorAll('label').forEach(function (lb, j) {
      lb.classList.remove('resp-certa', 'resp-errada');
      if (j === q.correta) lb.classList.add('resp-certa');
      if (idx >= 0 && j === idx && !certa) lb.classList.add('resp-errada');
    });
    var fb = bloco.querySelector('.feedback');
    fb.hidden = false;
    var certaTxt = q.alternativas[q.correta].replace(/[.?!]+$/, '');
    fb.innerHTML = (certa ? '<strong>✔ Certa!</strong> ' : (idx < 0 ? '<strong>✖ Sem resposta.</strong> ' : '<strong>✖ Errada.</strong> ')) +
      'Resposta certa: ' + esc(certaTxt) + '. ' + esc(q.explicacao || '');
  });
  aulaEstudo.acertos = acertos;
  aulaEstudo.erros = erros;
  var nota = $('estudo-nota');
  nota.hidden = false;
  nota.classList.toggle('nota-boa', acertos >= Math.ceil(total * 0.6));
  nota.innerHTML = '<strong>Você acertou ' + acertos + ' de ' + total + '.</strong>' +
    (erros.length ? ' Revise as questões ' + erros.join(', ') + ' — a resposta certa está marcada em verde.' : ' Parabéns, gabarito completo!');
  $('btn-refazer-quiz').hidden = false;
  $('estudo-resumo').textContent = montarResumoEstudo();
  nota.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function refazerQuiz() {
  if (!aulaEstudo) return;
  document.querySelectorAll('#estudo-quiz input[type="radio"]').forEach(function (r) { r.checked = false; });
  document.querySelectorAll('.estudo-questao').forEach(function (b) {
    b.classList.remove('certa', 'errada');
    b.querySelectorAll('label').forEach(function (lb) { lb.classList.remove('resp-certa', 'resp-errada'); });
    var fb = b.querySelector('.feedback');
    fb.hidden = true; fb.innerHTML = '';
  });
  aulaEstudo.acertos = null;
  aulaEstudo.erros = [];
  $('estudo-nota').hidden = true;
  $('btn-refazer-quiz').hidden = true;
  $('estudo-resumo').textContent = montarResumoEstudo();
  $('estudo-quiz').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------------------------------------------------------------- Resumo para o professor
function montarResumoEstudo() {
  if (!aulaEstudo) return '';
  var a = aulaEstudo;
  var linhas = [
    'Resumo de estudo — Brittech Educação',
    'Tema: ' + a.tema,
    a.nome ? 'Aluno(a): ' + a.nome : null,
    'Data: ' + hojeBR(),
    'Modo: ' + (a.modo === 'simulada' ? 'aula simulada' : 'aula de estudo') + ' — ' + (a.fonte === 'ia'
      ? 'gerada pela IA real (' + provedorAtual().nome + ' ' + provedorAtual().modelo + ')'
      : 'modo demonstração (sem IA real — conteúdo de exemplo)'),
    a.acertos === null ? 'Quiz: ainda não corrigido.' : 'Quiz: ' + a.acertos + ' de ' + a.quiz.length + ' acertos.',
    a.acertos !== null && a.erros.length ? 'Questões para revisar: ' + a.erros.join(', ') + '.' : null,
    a.acertos !== null && !a.erros.length ? 'Gabarito completo — sem questões para revisar.' : null,
  ].filter(function (x) { return x !== null; });
  return linhas.join('\n');
}

// ---------------------------------------------------------------- Ligações da aba
// Toggle de formato: "Aula simulada" (padrão) ou "Aula de estudo". O
// formato escolhido vale para a próxima geração — o botão principal muda o
// texto junto, para ficar óbvio o que vai acontecer em 1 clique.
function textoBotaoGerar() {
  return modoEstudo === 'simulada' ? 'Gerar aula simulada' : 'Gerar aula de estudo';
}
function setModoEstudo(modo) {
  modoEstudo = modo;
  $('btn-modo-estudo').classList.toggle('ativo', modo === 'estudo');
  $('btn-modo-simulada').classList.toggle('ativo', modo === 'simulada');
  $('btn-modo-estudo').setAttribute('aria-pressed', modo === 'estudo' ? 'true' : 'false');
  $('btn-modo-simulada').setAttribute('aria-pressed', modo === 'simulada' ? 'true' : 'false');
  $('btn-gerar-estudo').textContent = textoBotaoGerar();
}
$('btn-modo-estudo').addEventListener('click', function () { setModoEstudo('estudo'); });
$('btn-modo-simulada').addEventListener('click', function () { setModoEstudo('simulada'); });
$('btn-estudo-exemplo').addEventListener('click', function () {
  $('estudo-tema').value = EXEMPLO_ESTUDO_TEMA;
  $('estudo-texto').value = EXEMPLO_ESTUDO_TEXTO;
  avisar('Exemplo carregado: “Misturas homogêneas e heterogêneas” (Ciências, 6º ano — aula da biblioteca gratuita). Edite o tema ou o texto e clique em “' + textoBotaoGerar() + '”.');
});
$('btn-gerar-estudo').addEventListener('click', function () { gerarAulaEstudo(); });
$('btn-corrigir-quiz').addEventListener('click', function () { corrigirQuiz(); });
$('btn-refazer-quiz').addEventListener('click', function () { refazerQuiz(); });
$('btn-copiar-resumo').addEventListener('click', function (ev) {
  if (!aulaEstudo) { avisar('Gere primeiro uma aula de estudo.'); return; }
  copiarTexto(montarResumoEstudo(), ev.currentTarget);
});

// ---------------------------------------------------------------- Ganchos p/ testes automatizados (não afetam o uso normal)
if (window.__brittech) {
  window.__brittech.estudar = {
    getState: function () {
      return aulaEstudo ? { tema: aulaEstudo.tema, fonte: aulaEstudo.fonte, modo: aulaEstudo.modo, falas: aulaEstudo.dialogo ? aulaEstudo.dialogo.length : 0, passos: aulaEstudo.explicacao.length, revisao: aulaEstudo.revisao.length, quiz: aulaEstudo.quiz.length, acertos: aulaEstudo.acertos, erros: aulaEstudo.erros } : null;
    },
    getQuiz: function () { return aulaEstudo ? aulaEstudo.quiz : null; },
    getDialogo: function () { return aulaEstudo ? aulaEstudo.dialogo : null; },
    getModo: function () { return modoEstudo; },
    setModo: setModoEstudo,
    preencher: function (tema, texto, nome) {
      $('estudo-tema').value = tema || '';
      $('estudo-texto').value = texto || '';
      $('estudo-nome').value = nome || '';
    },
    gerar: gerarAulaEstudo,
    corrigir: corrigirQuiz,
    refazer: refazerQuiz,
    resumo: montarResumoEstudo,
    responder: function (i, alt) {
      var r = document.querySelector('input[name="estudo-q' + i + '"][value="' + alt + '"]');
      if (r) r.checked = true;
    },
  };
}
