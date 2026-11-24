// Brittech Educação — Agente "Brito" (agente.js)
// Assistente em linguagem natural para o professor elaborar DOCUMENTOS
// e PLANILHAS, na aba "Assistente" do MVP.
//
// O QUE ELE FAZ
// - Entende o pedido em pt-BR ("faz uma ata da reunião de pais",
//   "monta uma planilha de notas do 6º ano") e detecta o tipo:
//   documento (ata, relatório, parecer, ficha, planejamento anual,
//   sequência didática, comunicado, lista de chamada) ou planilha
//   (notas, frequência, planejamento por bimestre, controle de entregas).
// - Pergunta o que falta (turma, datas, nomes, disciplina) em perguntas
//   curtas — no máximo 2 rodadas — e depois entrega, com valores padrão
//   claros quando o professor não informar.
// - Com IA real ativa (chamarIA, de app.js — o mesmo motor dos planos),
//   gera o conteúdo com o provedor escolhido. Sem chave/proxy, gera a
//   partir dos modelos locais (abaixo) e mostra o aviso claro de
//   "modo demonstração, sem IA real".
// - Documentos: relatório, ata, ficha e parecer REUTILIZAM os geradores
//   locais de app.js (gerarRelatorio, gerarAta, gerarFicha, gerarParecer);
//   os demais (planejamento anual, sequência, comunicado, lista de
//   chamada) têm modelos locais próprios neste arquivo.
// - Saída: texto editável na tela + copiar + baixar .docx (gerador
//   próprio em JS puro, sem CDN — DOCX é um ZIP de XMLs, mesmo padrão do
//   gerador de PPTX em slides.js) + "Salvar como Google Doc" quando o
//   Google estiver conectado (google.js).
// - Planilhas: baixar .xlsx (gerador próprio em JS puro, mesmo padrão;
//   média por fórmula AVERAGE, situação por IF) + "Salvar como Google
//   Planilha" quando conectado (Sheets API, com os dados escritos).
//
// Este arquivo NÃO toca em app.js: só lê window.__brittech (chamarIA,
// modoIA, getUltimoPlano) e window.__brittechGoogle (conectar, criar
// documentos/planilhas). Não há chave nenhuma aqui.

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function xmlEsc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function semAcento(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function slug(s) {
    return String(s || 'documento').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'documento';
  }
  function hojeBR() {
    if (typeof window.hojeBR === 'function') return window.hojeBR();
    var d = new Date();
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }
  function hookIA() { return window.__brittech || null; }
  function hookGoogle() { return window.__brittechGoogle || null; }
  function modoIA() {
    var h = hookIA();
    return h && h.modoIA ? h.modoIA() : 'demo';
  }
  function chamarIA(prompt, sistema) {
    var h = hookIA();
    if (!h || !h.chamarIA) return Promise.reject(new Error('IA indisponível neste MVP.'));
    return h.chamarIA(prompt, sistema);
  }
  function ultimoPlano() {
    var h = hookIA();
    return h && h.getUltimoPlano ? h.getUltimoPlano() : null;
  }
  function nomeProvedorIA() {
    var h = hookIA();
    if (!h || !h.provedorAtual) return '';
    var p = h.provedorAtual();
    return p ? (p.nome + ' ' + p.modelo) : '';
  }

  // ---------------------------------------------------------- ZIP (mesmo padrão de slides.js)
  // Um .docx e um .xlsx são ZIPs de XMLs. Aqui montamos o ZIP com
  // entradas "stored" (sem compressão), igual ao gerador de PPTX.
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
  function zipStored(files, tipoBlob) {
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
    return new Blob([].concat(localParts, centralParts, [end]), { type: tipoBlob || 'application/zip' });
  }
  function baixarBlob(blob, nomeArquivo) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nomeArquivo;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
  }
  function relsXml(rels) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      rels.map(function (r) { return '<Relationship Id="' + r.id + '" Type="' + r.type + '" Target="' + r.target + '"/>'; }).join('') + '</Relationships>';
  }

  // ---------------------------------------------------------- DOCX (JS puro)
  // DOCX válido, editável no Word/LibreOffice/Google Docs: cada linha do
  // texto vira um parágrafo; a primeira linha (título) vai em negrito e
  // maior. Validado com python-docx nos testes (ver ../mvp-testes/).
  function montarDocx(titulo, texto) {
    var enc = new TextEncoder();
    var linhas = String(texto || '').replace(/\r\n?/g, '\n').split('\n');
    var paras = '';
    paras += '<w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t xml:space="preserve">' + xmlEsc(titulo || 'Documento') + '</w:t></w:r></w:p>';
    paras += '<w:p><w:r><w:t xml:space="preserve"></w:t></w:r></w:p>';
    linhas.forEach(function (linha) {
      if (!linha.trim()) {
        paras += '<w:p><w:r><w:t xml:space="preserve"></w:t></w:r></w:p>';
        return;
      }
      // Linhas em maiúsculas e curtas (ex.: "ATA DE REUNIÃO") viram
      // subtítulo em negrito; o resto vira parágrafo normal.
      var ehTituloSecao = linha.trim().length <= 60 && linha.trim() === linha.trim().toUpperCase() && /[A-ZÀ-Ú]/.test(linha);
      if (ehTituloSecao) {
        paras += '<w:p><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t xml:space="preserve">' + xmlEsc(linha) + '</w:t></w:r></w:p>';
      } else {
        paras += '<w:p><w:r><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">' + xmlEsc(linha) + '</w:t></w:r></w:p>';
      }
    });
    var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' + paras +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>' +
      '</w:body></w:document>';
    var stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault>' +
      '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
      '</w:styles>';
    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '<Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
      '</Types>';
    var fontTable = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:font w:name="Arial"><w:family w:val="swiss"/><w:pitch w:val="variable"/></w:font></w:fonts>';
    var coreProps = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<dc:title>' + xmlEsc(titulo || 'Documento') + '</dc:title>' +
      '<dc:creator>Brittech Educação</dc:creator>' +
      '<cp:lastModifiedBy>Brittech Educação</cp:lastModifiedBy>' +
      '</cp:coreProperties>';
    var appProps = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Brittech Educação</Application></Properties>';
    return zipStored([
      { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
      { name: '_rels/.rels', data: enc.encode(relsXml([{ id: 'rId1', type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument', target: 'word/document.xml' }])) },
      { name: 'word/document.xml', data: enc.encode(documentXml) },
      { name: 'word/_rels/document.xml.rels', data: enc.encode(relsXml([{ id: 'rId1', type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles', target: 'styles.xml' }, { id: 'rId2', type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable', target: 'fontTable.xml' }])) },
      { name: 'word/styles.xml', data: enc.encode(stylesXml) },
      { name: 'word/fontTable.xml', data: enc.encode(fontTable) },
      { name: 'docProps/core.xml', data: enc.encode(coreProps) },
      { name: 'docProps/app.xml', data: enc.encode(appProps) },
    ], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  }

  // ---------------------------------------------------------- XLSX (JS puro)
  // planilha: { aba: string, cabecalho: [...], linhas: [[cel, ...], ...] }
  // Célula pode ser string, número, ou {f: 'AVERAGE(B2:E2)'} (fórmula, em
  // inglês com vírgula — o Excel/Sheets localiza na abertura). Strings vão
  // como inlineStr (sem sharedStrings). A primeira linha (cabeçalho) vai
  // em negrito com fundo. Validado com openpyxl nos testes.
  function letraColuna(n) {
    var s = '';
    n += 1;
    while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
    return s;
  }
  function celulaXml(ref, cel, cabecalho) {
    if (cel && typeof cel === 'object' && typeof cel.f === 'string') {
      return '<c r="' + ref + '"' + (cabecalho ? ' s="1"' : '') + '><f>' + xmlEsc(cel.f) + '</f><v>0</v></c>';
    }
    if (typeof cel === 'number' && isFinite(cel)) {
      return '<c r="' + ref + '"' + (cabecalho ? ' s="1"' : '') + '><v>' + cel + '</v></c>';
    }
    var txt = (cel == null ? '' : String(cel));
    return '<c r="' + ref + '" t="inlineStr"' + (cabecalho ? ' s="1"' : '') + '><is><t xml:space="preserve">' + xmlEsc(txt) + '</t></is></c>';
  }
  function montarXlsx(titulo, planilha) {
    var enc = new TextEncoder();
    var aba = (planilha && planilha.aba) || 'Planilha';
    var cabecalho = (planilha && planilha.cabecalho) || [];
    var linhas = (planilha && planilha.linhas) || [];
    var todas = [cabecalho].concat(linhas);
    var nCols = 0;
    todas.forEach(function (l) { nCols = Math.max(nCols, l.length); });
    var rowsXml = '';
    var larguras = [];
    for (var r = 0; r < todas.length; r++) {
      var linha = todas[r];
      var cellsXml = '';
      for (var c = 0; c < linha.length; c++) {
        var ref = letraColuna(c) + (r + 1);
        cellsXml += celulaXml(ref, linha[c], r === 0);
        var tam = String(linha[c] == null ? '' : (linha[c].f || linha[c])).length;
        larguras[c] = Math.max(larguras[c] || 10, Math.min(40, tam + 2));
      }
      rowsXml += '<row r="' + (r + 1) + '">' + cellsXml + '</row>';
    }
    var colsXml = '<cols>' + larguras.map(function (w, i) {
      return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>';
    }).join('') + '</cols>';
    var sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0"/></sheetViews>' +
      colsXml + '<sheetData>' + rowsXml + '</sheetData></worksheet>';
    var workbookXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="' + xmlEsc(aba.slice(0, 31)) + '" sheetId="1" r:id="rId1"/></sheets></workbook>';
    var stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts>' +
      '<fills><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9E2F3"/><bgColor rgb="FFD9E2F3"/></patternFill></fill></fills>' +
      '<borders><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>' +
      '<cellStyles><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '</Types>';
    return zipStored([
      { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
      { name: '_rels/.rels', data: enc.encode(relsXml([{ id: 'rId1', type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument', target: 'xl/workbook.xml' }])) },
      { name: 'xl/workbook.xml', data: enc.encode(workbookXml) },
      { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(relsXml([{ id: 'rId1', type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet', target: 'worksheets/sheet1.xml' }, { id: 'rId2', type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles', target: 'styles.xml' }])) },
      { name: 'xl/worksheets/sheet1.xml', data: enc.encode(sheetXml) },
      { name: 'xl/styles.xml', data: enc.encode(stylesXml) },
    ], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  // ---------------------------------------------------------- Tipos de pedido
  var DISCIPLINAS = ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Arte', 'Inglês', 'Educação Física', 'Sociologia', 'Filosofia', 'Física', 'Química', 'Biologia', 'Português'];
  var TIPOS_DOC = {
    'ata': { nome: 'ata de reunião', rotulo: 'Ata de reunião', campos: ['data', 'turma', 'pauta'], pergunta: 'Qual a data e a turma? E a reunião é de pais, conselho de classe ou equipe? (Ex.: 25/11/2026, 6º ano B, reunião de pais)' },
    'relatorio': { nome: 'relatório de turma', rotulo: 'Relatório de turma', campos: ['turma', 'periodo'], pergunta: 'De qual turma e qual período? (Ex.: 2º ano B, 1º bimestre de 2026)' },
    'parecer': { nome: 'parecer descritivo', rotulo: 'Parecer descritivo', campos: ['aluno', 'turma'], pergunta: 'De qual aluno(a) e qual turma? (Ex.: Maria Silva, 7º ano C)' },
    'ficha': { nome: 'ficha de avaliação', rotulo: 'Ficha de avaliação', campos: ['turma', 'disciplina'], pergunta: 'De qual turma e disciplina? (Ex.: 6º ano A, Ciências)' },
    'planejamento-anual': { nome: 'planejamento anual', rotulo: 'Planejamento anual', campos: ['disciplina', 'ano'], pergunta: 'De qual disciplina e ano/série? (Ex.: Ciências, 6º ano)' },
    'sequencia': { nome: 'sequência didática', rotulo: 'Sequência didática', campos: ['tema', 'disciplina'], pergunta: 'Sobre qual tema e de qual disciplina? (Ex.: Misturas, Ciências)' },
    'comunicado': { nome: 'comunicado aos pais', rotulo: 'Comunicado aos pais', campos: ['assunto', 'turma'], pergunta: 'Sobre o que é o comunicado e para qual turma? (Ex.: festa junina, 3º ano A)' },
    'lista-chamada': { nome: 'lista de chamada', rotulo: 'Lista de chamada', campos: ['turma', 'alunos'], pergunta: 'De qual turma? E me passe os nomes dos alunos (um por linha, ou separados por vírgula).' },
  };
  var TIPOS_PLANILHA = {
    'notas': { nome: 'planilha de notas', rotulo: 'Planilha de notas', campos: ['turma', 'disciplina'], pergunta: 'De qual turma e disciplina? (Ex.: 6º ano B, Matemática). As avaliações serão Av 1, Av 2, Av 3 e Trabalho — me diga se forem outras.' },
    'frequencia': { nome: 'planilha de frequência', rotulo: 'Planilha de frequência', campos: ['turma', 'mes'], pergunta: 'De qual turma e qual mês? (Ex.: 7º ano C, novembro). E me passe os nomes dos alunos (um por linha, ou separados por vírgula).' },
    'planejamento-bimestre': { nome: 'planejamento anual por bimestre', rotulo: 'Planejamento por bimestre', campos: ['disciplina', 'ano'], pergunta: 'De qual disciplina e ano/série? (Ex.: História, 8º ano)' },
    'entregas': { nome: 'controle de entregas', rotulo: 'Controle de entregas', campos: ['turma', 'atividades'], pergunta: 'De qual turma? E quais atividades controlar? (Ex.: 9º ano B — redação, cartaz e apresentação)' },
  };
  var MAX_RODADAS_PERGUNTAS = 2;

  // ---------------------------------------------------------- Detecção do pedido
  function detectarPedido(texto) {
    var t = semAcento(texto || '');
    var tem = function () {
      for (var i = 0; i < arguments.length; i++) if (t.indexOf(arguments[i]) !== -1) return true;
      return false;
    };
    var ehPlanilha = tem('planilha', 'tabela de notas', 'tabela de frequencia', 'controle de entrega');
    // Planilhas primeiro (o pedido "planilha de notas" contém "notas").
    if (ehPlanilha || tem('frequencia', 'controle de entrega')) {
      if (tem('frequencia', 'presenca', 'falta')) return { kind: 'planilha', tipo: 'frequencia' };
      if (tem('entrega')) return { kind: 'planilha', tipo: 'entregas' };
      if (tem('planejamento') && tem('bimestre')) return { kind: 'planilha', tipo: 'planejamento-bimestre' };
      if (tem('nota')) return { kind: 'planilha', tipo: 'notas' };
      if (ehPlanilha) return { kind: 'planilha', tipo: 'notas' }; // "planilha" sozinha: assume notas
    }
    if (tem('lista de chamada', 'lista de presenca', 'chamada')) return { kind: 'documento', tipo: 'lista-chamada' };
    if (tem('planejamento anual', 'plano anual')) return { kind: 'documento', tipo: 'planejamento-anual' };
    if (tem('sequencia didatica', 'sequencia de aula', 'sequencia')) return { kind: 'documento', tipo: 'sequencia' };
    if (tem('comunicado', 'aviso aos pais', 'bilhete aos pais')) return { kind: 'documento', tipo: 'comunicado' };
    if (tem('ata', 'reuniao de pais', 'reuniao de conselho', 'conselho de classe')) return { kind: 'documento', tipo: 'ata' };
    if (tem('parecer')) return { kind: 'documento', tipo: 'parecer' };
    if (tem('ficha de avaliacao', 'ficha avaliativa')) return { kind: 'documento', tipo: 'ficha' };
    if (tem('relatorio')) return { kind: 'documento', tipo: 'relatorio' };
    if (tem('planejamento') && tem('bimestre')) return { kind: 'planilha', tipo: 'planejamento-bimestre' };
    if (tem('planejamento')) return { kind: 'documento', tipo: 'planejamento-anual' };
    return null;
  }

  // ---------------------------------------------------------- Extração de dados da mensagem
  function extrairCampos(texto, ctx) {
    ctx = ctx || {};
    var t = texto || '';
    var m;
    // Turma: "6º ano B", "2o ano", "7ª série A"
    m = t.match(/(\d{1,2})\s*[ºoªa]?\s*(ano|s[eé]rie)\s*([A-Za-z])?/i);
    if (m && !ctx.turma) {
      ctx.turma = m[1] + 'º ' + (semAcento(m[2]).indexOf('serie') !== -1 ? 'série' : 'ano') + (m[3] ? ' ' + m[3].toUpperCase() : '');
      ctx.ano = ctx.turma;
    }
    m = t.match(/turma\s*:?\s*([^\n,;]+)/i);
    if (m && !ctx.turma) ctx.turma = m[1].trim();
    // Data: dd/mm/aaaa
    m = t.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
    if (m && !ctx.data) ctx.data = m[1];
    // Período / bimestre
    m = t.match(/((?:1|2|3|4)[ºo])\s*bimestre(?:\s*de\s*(\d{4}))?/i);
    if (m && !ctx.periodo) ctx.periodo = m[1] + ' bimestre' + (m[2] ? ' de ' + m[2] : ' de 2026');
    if (!ctx.mes) {
      m = t.match(/m[eê]s\s+de\s+([a-zç]+)/i) || t.match(/\b(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i);
      if (m) ctx.mes = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    }
    // Disciplina
    if (!ctx.disciplina) {
      for (var i = 0; i < DISCIPLINAS.length; i++) {
        if (semAcento(t).indexOf(semAcento(DISCIPLINAS[i])) !== -1) { ctx.disciplina = DISCIPLINAS[i]; break; }
      }
    }
    // Aluno(a): "aluno Maria Silva" / "parecer da Ana" / "para o João"
    m = t.match(/alun[oa](?:\(a\))?\s*:?\s*([A-ZÀ-Ú][A-Za-zÀ-ú]+(?:\s+[A-ZÀ-Ú][A-Za-zÀ-ú]+){0,3})/);
    if (m && !ctx.aluno) ctx.aluno = m[1].trim();
    // Tema: "sobre X" / "tema: X"
    m = t.match(/(?:sobre|tema\s*:?)\s+([^,\n;]+)/i);
    if (m && !ctx.tema) ctx.tema = m[1].trim().replace(/\s+(turma|para|do|da|de)\s.*$/i, '').trim();
    // Assunto (comunicado): "sobre X" também serve; "assunto: X"
    m = t.match(/assunto\s*:?\s*([^,\n;]+)/i);
    if (m && !ctx.assunto) ctx.assunto = m[1].trim();
    if (!ctx.assunto && ctx.tema) ctx.assunto = ctx.tema;
    // Pauta (ata): reunião de pais / conselho / equipe
    var ts = semAcento(t);
    if (!ctx.pauta) {
      if (ts.indexOf('reuniao de pais') !== -1) ctx.pauta = 'Reunião de pais';
      else if (ts.indexOf('conselho de classe') !== -1) ctx.pauta = 'Conselho de classe';
      else if (ts.indexOf('reuniao') !== -1) ctx.pauta = 'Reunião de equipe';
    }
    // Alunos (lista): "alunos: Ana, Bruno" ou várias linhas de nomes
    if (!ctx.alunos) {
      var lista = extrairListaAlunos(t);
      if (lista.length) ctx.alunos = lista;
    }
    // Atividades (entregas): "atividades: redação, cartaz" ou após "—"
    m = t.match(/atividades?\s*:?\s*([^,\n]+(?:,[^,\n]+)+)/i);
    if (m && !ctx.atividades) {
      ctx.atividades = m[1].split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 1; }).slice(0, 5);
    }
    return ctx;
  }
  function extrairListaAlunos(t) {
    var nomes = [];
    var m = t.match(/alunos?\s*:?\s*([\s\S]+)/i);
    var bloco = m ? m[1] : '';
    // Se não há "alunos:", aceita a mensagem inteira quando ela parece
    // ser só uma lista (várias linhas curtas de nomes próprios).
    if (!bloco) {
      var linhasMsg = t.split('\n').map(function (s) { return s.trim(); }).filter(function (s) { return s; });
      if (linhasMsg.length >= 2 && linhasMsg.every(function (l) { return /^[A-ZÀ-Ú][A-Za-zÀ-ú ]+$/.test(l) && l.split(' ').length <= 4; })) bloco = t;
    }
    if (!bloco) return nomes;
    bloco.split(/[\n,;]/).forEach(function (parte) {
      var nome = parte.trim().replace(/^\d+[.)]\s*/, '');
      if (/^[A-ZÀ-Ú][A-Za-zÀ-ú]+(?:\s+[A-ZÀ-Ú][A-Za-zÀ-ú]+){0,3}$/.test(nome)) nomes.push(nome);
    });
    return nomes.slice(0, 40);
  }

  function camposFaltando(tipo, kind, ctx) {
    var def = kind === 'planilha' ? TIPOS_PLANILHA[tipo] : TIPOS_DOC[tipo];
    if (!def) return [];
    return def.campos.filter(function (c) {
      if (c === 'alunos') return !(ctx.alunos && ctx.alunos.length);
      if (c === 'atividades') return !(ctx.atividades && ctx.atividades.length);
      return !(ctx[c] && String(ctx[c]).trim());
    });
  }
  function aplicarPadroes(tipo, kind, ctx) {
    var usados = [];
    var padrao = function (campo, valor, rotulo) {
      if (!ctx[campo] || (Array.isArray(ctx[campo]) && !ctx[campo].length)) {
        ctx[campo] = valor;
        usados.push(rotulo + ': ' + (Array.isArray(valor) ? valor.join(', ') : valor));
      }
    };
    padrao('data', hojeBR(), 'data');
    padrao('professor', campoDoc('doc-professor') || 'Professor(a)', 'professor(a)');
    padrao('periodo', '1º bimestre de 2026', 'período');
    padrao('turma', 'Turma não informada', 'turma');
    padrao('disciplina', (ultimoPlano() && ultimoPlano().componente) || 'Disciplina não informada', 'disciplina');
    padrao('ano', ctx.turma || 'Ano/série não informado', 'ano/série');
    padrao('tema', (ultimoPlano() && ultimoPlano().tema) || 'Tema não informado', 'tema');
    padrao('assunto', ctx.tema || 'Assunto não informado', 'assunto');
    padrao('pauta', 'Reunião de equipe', 'pauta');
    padrao('mes', 'Novembro', 'mês');
    padrao('aluno', 'o(a) aluno(a)', 'aluno(a)');
    if (tipo === 'lista-chamada' || tipo === 'frequencia') {
      if (!ctx.alunos || !ctx.alunos.length) {
        ctx.alunos = ['Aluno 1', 'Aluno 2', 'Aluno 3', 'Aluno 4', 'Aluno 5'];
        usados.push('alunos: 5 linhas em branco para preencher (Aluno 1 a Aluno 5)');
      }
    }
    if (tipo === 'entregas' && (!ctx.atividades || !ctx.atividades.length)) {
      ctx.atividades = ['Atividade 1', 'Atividade 2', 'Atividade 3'];
      usados.push('atividades: Atividade 1, Atividade 2 e Atividade 3 (edite na planilha)');
    }
    return usados;
  }
  function campoDoc(id) {
    var el = $(id);
    return el ? el.value.trim() : '';
  }

  // ---------------------------------------------------------- Modelos locais (documentos)
  // Relatório, ata, ficha e parecer reutilizam app.js; os demais são
  // modelos próprios deste arquivo.
  function baseParaDocs(ctx) {
    var p = ultimoPlano();
    return {
      turma: ctx.turma || (p && p.turma) || 'Turma não informada',
      periodo: ctx.periodo || 'Período não informado',
      data: ctx.data || hojeBR(),
      professor: ctx.professor || 'Professor(a)',
      tema: ctx.tema || (p && p.tema) || 'Tema não informado',
      etapa: (p && p.etapaNome) || 'Etapa não informada',
      componente: ctx.disciplina || (p && p.componente) || 'Disciplina não informada',
      ano: ctx.ano || ctx.turma || 'Ano/série não informado',
      habilidade: (p && p.habilidade) ? (p.habilidade.codigo + ' — ' + p.habilidade.descricao) : 'Habilidade BNCC não informada',
      codigo: (p && p.habilidade) ? p.habilidade.codigo : '',
      duracao: (p && p.duracao) || '50',
      confirmar: !!(p && p.habilidade && p.habilidade.status === 'a confirmar'),
    };
  }
  function gerarParecerLocal(b, aluno) {
    return 'PARECER DESCRITIVO\n' +
      'Aluno(a): ' + aluno + ' | Turma: ' + b.turma + ' | Período: ' + b.periodo + ' | Data: ' + b.data + '\nProfessor(a): ' + b.professor + '\n\n' +
      'No período, ' + aluno + ' participou das aulas de ' + b.componente + ' (' + b.ano + '), incluindo o trabalho com o tema "' + b.tema + '", ' +
      'alinhado à habilidade BNCC ' + b.habilidade + '.\n\n' +
      'Avanços: ' + aluno + ' demonstrou participação nas atividades, progrediu na compreensão do tema e conseguiu registrar o que aprendeu, com apoio do(a) professor(a) e dos colegas quando necessário.\n\n' +
      'Dificuldades: ainda há pontos a consolidar' + (b.codigo ? ' na habilidade ' + b.codigo : '') + ', que seguirão sendo trabalhados com atividades de reforço e acompanhamento individual.\n\n' +
      'Orientações: recomenda-se continuar o acompanhamento em sala, com tarefas em dupla e retomadas do tema, e manter o diálogo com a família sobre a rotina de estudos.\n\n' +
      (b.confirmar ? 'Observação: a habilidade ' + b.codigo + ' está marcada como "a confirmar" no catálogo BNCC — conferir a descrição no texto oficial antes de entregar este parecer.\n\n' : '') +
      '_________________________________\n' + b.professor + '\n' + b.data;
  }
  function gerarPlanejamentoAnualLocal(ctx, b) {
    var disc = ctx.disciplina || b.componente;
    var ano = ctx.ano || b.ano;
    var conteudos = {
      'Ciências': ['Matéria e energia: misturas e transformações', 'Vida e evolução: seres vivos e ambiente', 'Terra e Universo: movimentos e fenômenos', 'Revisão e projetos de investigação'],
      'Matemática': ['Números e operações', 'Álgebra e padrões', 'Geometria e medidas', 'Probabilidade, estatística e revisão'],
      'Língua Portuguesa': ['Leitura e interpretação de textos', 'Produção de textos: gêneros do cotidiano', 'Oralidade e argumentação', 'Análise linguística e revisão'],
      'História': ['O tempo histórico e as fontes', 'Brasil: formação e diversidade', 'Mundo contemporâneo', 'Revisão e projetos'],
      'Geografia': ['O lugar e a paisagem', 'Território e sociedade', 'Natureza e recursos', 'Revisão e projetos'],
    };
    var porBim = conteudos[disc] || ['Introdução ao tema do ano', 'Aprofundamento dos conteúdos', 'Projetos e aplicações', 'Revisão e consolidação'];
    var linhas = porBim.map(function (c, i) { return (i + 1) + 'º bimestre: ' + c + '.'; }).join('\n');
    return 'PLANEJAMENTO ANUAL — ' + disc.toUpperCase() + '\n' +
      'Ano/série: ' + ano + ' | Ano letivo: 2026\nProfessor(a): ' + b.professor + ' | Data: ' + b.data + '\n\n' +
      '1. Objetivos gerais\n' +
      'Ao final do ano, os alunos deverão compreender os conteúdos de ' + disc + ' previstos para ' + ano + ', desenvolver leitura, registro e argumentação sobre os temas e aplicar o que aprenderam em situações do cotidiano.\n\n' +
      '2. Conteúdos por bimestre\n' + linhas + '\n\n' +
      '3. Metodologia\n' +
      'Alinhado à BNCC, com aulas expositivas dialogadas, atividades em duplas e grupos, experimentos e projetos curtos, leitura de textos e registros no caderno.\n\n' +
      '4. Avaliação\n' +
      'Contínua e formativa: participação, produções, provas e trabalhos, com recuperação paralela para quem precisar de apoio.\n\n' +
      '5. Recursos\n' +
      'Lousa, material impresso, objetos do cotidiano da turma e, se houver, projetor ou celular do professor.\n\n' +
      '_________________________________\n' + b.professor + '\n' + b.data;
  }
  function gerarSequenciaLocal(ctx, b) {
    var tema = ctx.tema || b.tema;
    return 'SEQUÊNCIA DIDÁTICA — ' + tema + '\n' +
      'Disciplina: ' + (ctx.disciplina || b.componente) + ' | Ano/série: ' + (ctx.ano || b.ano) + ' | Turma: ' + b.turma + '\nProfessor(a): ' + b.professor + ' | Data: ' + b.data + '\n\n' +
      'Objetivo: ao final da sequência, os alunos deverão compreender "' + tema + '" e aplicar o que aprenderam em uma produção final.\n\n' +
      'Aula 1 — Levantamento do que a turma já sabe\n' +
      'Roda de conversa e registro das hipóteses dos alunos sobre "' + tema + '".\n\n' +
      'Aula 2 — Apresentação do conteúdo\n' +
      'Explicação com exemplo concreto, leitura de texto curto e perguntas à turma.\n\n' +
      'Aula 3 — Prática em duplas\n' +
      'Atividade prática sobre "' + tema + '" em duplas, com registro no caderno.\n\n' +
      'Aula 4 — Produção final e socialização\n' +
      'Cada dupla apresenta sua produção; fechamento com síntese do que foi aprendido.\n\n' +
      'Avaliação: participação nas aulas, registro das atividades e produção final, com observação de quem atingiu o objetivo e quem precisa de apoio.\n\n' +
      '_________________________________\n' + b.professor + '\n' + b.data;
  }
  function gerarComunicadoLocal(ctx, b) {
    return 'COMUNICADO AOS PAIS / RESPONSÁVEIS\n' +
      'Turma: ' + b.turma + ' | Data: ' + b.data + '\nProfessor(a): ' + b.professor + '\n\n' +
      'Prezados pais e responsáveis,\n\n' +
      'Comunicamos que ' + (ctx.assunto || 'o assunto informado') + '. Pedimos que leiam com atenção e, se houver dúvida, procurem o(a) professor(a) ou a coordenação da escola.\n\n' +
      'Agradecemos a parceria de sempre entre escola e família.\n\n' +
      'Atenciosamente,\n' + b.professor + '\n' + b.data;
  }
  function gerarListaChamadaLocal(ctx, b) {
    var linhas = (ctx.alunos || []).map(function (nome, i) {
      return String(i + 1).padStart(2, '0') + '. ' + nome + ' — Presente ( )  Ausente ( )  Assinatura: ______________________';
    }).join('\n');
    return 'LISTA DE CHAMADA\n' +
      'Turma: ' + b.turma + ' | Data: ' + b.data + '\nProfessor(a): ' + b.professor + '\n\n' +
      linhas + '\n\n' +
      'Total de alunos: ' + (ctx.alunos || []).length + ' | Presentes: ______ | Ausentes: ______\n\n' +
      '_________________________________\n' + b.professor + '\n' + b.data;
  }

  function gerarDocumentoLocal(tipo, ctx) {
    var b = baseParaDocs(ctx);
    if (tipo === 'relatorio' && typeof window.gerarRelatorio === 'function') return window.gerarRelatorio(b);
    if (tipo === 'ata' && typeof window.gerarAta === 'function') return window.gerarAta(b);
    if (tipo === 'ficha' && typeof window.gerarFicha === 'function') return window.gerarFicha(b);
    if (tipo === 'parecer') return gerarParecerLocal(b, ctx.aluno || 'o(a) aluno(a)');
    if (tipo === 'planejamento-anual') return gerarPlanejamentoAnualLocal(ctx, b);
    if (tipo === 'sequencia') return gerarSequenciaLocal(ctx, b);
    if (tipo === 'comunicado') return gerarComunicadoLocal(ctx, b);
    if (tipo === 'lista-chamada') return gerarListaChamadaLocal(ctx, b);
    return '';
  }

  // ---------------------------------------------------------- Modelos locais (planilhas)
  function gerarPlanilhaLocal(tipo, ctx) {
    var alunos = (ctx.alunos && ctx.alunos.length) ? ctx.alunos : ['Aluno 1', 'Aluno 2', 'Aluno 3', 'Aluno 4', 'Aluno 5'];
    var turma = ctx.turma || 'Turma não informada';
    if (tipo === 'notas') {
      var linhasNotas = alunos.map(function (nome, i) {
        var r = i + 2;
        return [nome, '', '', '', '', { f: 'AVERAGE(B' + r + ':E' + r + ')' }, { f: 'IF(F' + r + '="","",IF(F' + r + '>=5,"Aprovado","Recuperação"))' }];
      });
      return { aba: 'Notas', titulo: 'Planilha de notas — ' + turma + ' (' + (ctx.disciplina || 'Disciplina') + ')', cabecalho: ['Aluno', 'Av 1', 'Av 2', 'Av 3', 'Trabalho', 'Média', 'Situação'], linhas: linhasNotas };
    }
    if (tipo === 'frequencia') {
      var cabFreq = ['Aluno'];
      for (var a = 1; a <= 10; a++) cabFreq.push('Aula ' + a);
      cabFreq.push('Presenças', '% Frequência (0–100)');
      var linhasFreq = alunos.map(function (nome, i) {
        var r = i + 2;
        return [nome, '', '', '', '', '', '', '', '', '', '', { f: 'COUNTIF(B' + r + ':K' + r + ',"P")' }, { f: 'ROUND(L' + r + '/10*100,0)' }];
      });
      return { aba: 'Frequência', titulo: 'Planilha de frequência — ' + turma + ' (' + (ctx.mes || 'Mês') + ')', cabecalho: cabFreq, linhas: linhasFreq };
    }
    if (tipo === 'planejamento-bimestre') {
      var disc = ctx.disciplina || 'Disciplina';
      return { aba: 'Planejamento', titulo: 'Planejamento por bimestre — ' + disc + ' (' + (ctx.ano || ctx.turma || '') + ')', cabecalho: ['Bimestre', 'Tema / Conteúdo', 'Habilidade BNCC', 'Atividades', 'Avaliação'], linhas: [
        ['1º bimestre', 'Introdução ao tema do ano', '', 'Acolhimento e levantamento do que a turma sabe', 'Observação e registro'],
        ['2º bimestre', 'Aprofundamento dos conteúdos', '', 'Atividades em duplas e projetos curtos', 'Produções e prova'],
        ['3º bimestre', 'Projetos e aplicações', '', 'Projeto em grupo e apresentação', 'Trabalho e participação'],
        ['4º bimestre', 'Revisão e consolidação', '', 'Revisão e recuperação paralela', 'Avaliação final'],
      ] };
    }
    if (tipo === 'entregas') {
      var acts = (ctx.atividades && ctx.atividades.length) ? ctx.atividades : ['Atividade 1', 'Atividade 2', 'Atividade 3'];
      var cabEnt = ['Aluno'].concat(acts, ['Entregues', 'Observações']);
      var nAt = acts.length;
      var linhasEnt = alunos.map(function (nome, i) {
        var r = i + 2;
        var linha = [nome];
        for (var k = 0; k < nAt; k++) linha.push('');
        var ultimaCol = letraColuna(nAt);
        linha.push({ f: 'COUNTIF(B' + r + ':' + ultimaCol + r + ',"Entregue")' });
        linha.push('');
        return linha;
      });
      return { aba: 'Entregas', titulo: 'Controle de entregas — ' + turma, cabecalho: cabEnt, linhas: linhasEnt };
    }
    return null;
  }

  // ---------------------------------------------------------- Geração com IA real
  var PROMPT_SISTEMA_AGENTE = 'Você é um assistente de documentação escolar brasileiro. Escreva documentos e planilhas práticos, em português, adequados à realidade da escola pública brasileira. Não invente nomes de alunos, datas, números nem fatos — use só os dados informados; o que não foi informado, deixe em branco ou como "a preencher". Responda sempre em português.';
  function contextoTexto(ctx) {
    var partes = [];
    if (ctx.turma) partes.push('Turma: ' + ctx.turma);
    if (ctx.ano) partes.push('Ano/série: ' + ctx.ano);
    if (ctx.disciplina) partes.push('Disciplina: ' + ctx.disciplina);
    if (ctx.periodo) partes.push('Período: ' + ctx.periodo);
    if (ctx.data) partes.push('Data: ' + ctx.data);
    if (ctx.professor) partes.push('Professor(a): ' + ctx.professor);
    if (ctx.tema) partes.push('Tema: ' + ctx.tema);
    if (ctx.assunto) partes.push('Assunto: ' + ctx.assunto);
    if (ctx.pauta) partes.push('Pauta: ' + ctx.pauta);
    if (ctx.aluno) partes.push('Aluno(a): ' + ctx.aluno);
    if (ctx.mes) partes.push('Mês: ' + ctx.mes);
    if (ctx.alunos && ctx.alunos.length) partes.push('Alunos: ' + ctx.alunos.join(', '));
    if (ctx.atividades && ctx.atividades.length) partes.push('Atividades: ' + ctx.atividades.join(', '));
    return partes.join('\n');
  }
  function gerarDocumentoComIA(tipo, ctx) {
    var def = TIPOS_DOC[tipo];
    var prompt = 'Escreva um(a) ' + def.nome + ' completo(a), em português, em texto puro (sem HTML, sem markdown), pronto para o professor revisar e entregar.\n\nDados:\n' + contextoTexto(ctx) +
      '\n\nRegras: use SOMENTE os dados acima — não invente nomes, datas ou fatos. O que não foi informado, deixe como "a preencher". Estruture com títulos em maiúsculas e seções numeradas, como um documento escolar formal.';
    return chamarIA(prompt, PROMPT_SISTEMA_AGENTE).then(function (texto) {
      return texto.replace(/```/g, '').trim();
    });
  }
  function gerarPlanilhaComIA(tipo, ctx) {
    var def = TIPOS_PLANILHA[tipo];
    var prompt = 'Monte os dados de uma ' + def.nome + ' para um professor, em JSON válido e SOMENTE JSON, sem nenhum texto fora do JSON, neste formato exato:\n' +
      '{"titulo":"...","cabecalho":["...","..."],"linhas":[["...","..."],["...","..."]]}\n\n' +
      'Regras: use SOMENTE os dados abaixo — não invente nomes de alunos nem notas. Células sem valor ficam como string vazia "". ' +
      'Se o tipo for planilha de notas, inclua colunas de avaliações e uma coluna "Média" — mas NÃO calcule a média: deixe a célula vazia (o MVP calcula por fórmula). ' +
      'Inclua uma linha por aluno informado; se nenhum aluno foi informado, inclua 5 linhas "Aluno 1" a "Aluno 5".\n\nDados:\n' + contextoTexto(ctx);
    return chamarIA(prompt, PROMPT_SISTEMA_AGENTE).then(function (texto) {
      var limpo = texto.replace(/```json|```/g, '').trim();
      var ini = limpo.indexOf('{'), fim = limpo.lastIndexOf('}');
      if (ini === -1 || fim === -1) throw new Error('A IA não devolveu um JSON de planilha.');
      var obj = JSON.parse(limpo.slice(ini, fim + 1));
      if (!Array.isArray(obj.cabecalho) || !Array.isArray(obj.linhas) || !obj.cabecalho.length) throw new Error('O JSON da IA veio incompleto.');
      return { aba: 'Planilha', titulo: obj.titulo || def.rotulo, cabecalho: obj.cabecalho.map(String), linhas: obj.linhas };
    });
  }

  // ---------------------------------------------------------- Estado da conversa
  var estado = {
    pedido: null,      // { kind, tipo, ctx }
    rodada: 0,         // rodadas de perguntas já feitas (máx. 2)
    resultado: null,   // { kind, tipo, titulo, texto?, planilha?, fonte, padroesUsados }
    ocupado: false,
  };
  function resetar(soConversa) {
    estado.pedido = null;
    estado.rodada = 0;
    if (!soConversa) estado.resultado = null;
  }

  // ---------------------------------------------------------- Interface (chat)
  function elChat() { return $('agente-chat'); }
  function adicionarMensagem(quem, texto) {
    var chat = elChat();
    if (!chat) return null;
    var div = document.createElement('div');
    div.className = 'msg-agente msg-' + quem;
    div.textContent = texto;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
  }
  function avisoModoTexto(fonte) {
    if (fonte === 'ia') return 'Gerado pela IA real (' + nomeProvedorIA() + '). Revise antes de usar.';
    if (fonte === 'demo-erro') return 'Não foi possível usar a IA real — gerado em modo demonstração, sem IA real, a partir de modelo local. Revise antes de usar.';
    return 'Modo demonstração, sem IA real — gerado a partir de modelo local. Para a IA escrever sob medida, configure uma chave na aba “Planos e IA”.';
  }

  function mostrarResultado() {
    var r = estado.resultado;
    var area = $('agente-resultado');
    if (!area || !r) return;
    area.hidden = false;
    $('agente-resultado-titulo').textContent = r.titulo;
    var aviso = $('agente-aviso-modo');
    aviso.textContent = avisoModoTexto(r.fonte);
    aviso.classList.toggle('ia-ativa', r.fonte === 'ia');
    var txtArea = $('agente-texto');
    var tabelaDiv = $('agente-tabela');
    if (r.kind === 'documento') {
      txtArea.hidden = false;
      tabelaDiv.hidden = true;
      txtArea.value = r.texto || '';
    } else {
      txtArea.hidden = true;
      tabelaDiv.hidden = false;
      tabelaDiv.innerHTML = renderTabela(r.planilha);
    }
    var btnBaixar = $('agente-baixar');
    btnBaixar.textContent = r.kind === 'documento' ? 'Baixar .docx' : 'Baixar .xlsx';
    var btnGoogle = $('agente-google');
    btnGoogle.textContent = r.kind === 'documento' ? 'Salvar como Google Doc' : 'Salvar como Google Planilha';
    var statusGoogle = $('agente-status-google');
    var g = hookGoogle();
    if (statusGoogle && g) {
      statusGoogle.textContent = g.conectado()
        ? 'Google conectado' + (g.getState().email ? ' como ' + g.getState().email : '') + ' — dá para salvar no seu Drive.'
        : 'Google não conectado — o arquivo baixa no seu computador. Para salvar no Drive, conecte o Google na aba “Planos e IA”.';
    }
    area.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function renderTabela(planilha) {
    if (!planilha) return '<p>Sem dados.</p>';
    var html = '<table class="tabela-agente"><thead><tr>' +
      planilha.cabecalho.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    planilha.linhas.forEach(function (linha) {
      html += '<tr>' + linha.map(function (cel) {
        var v = (cel && typeof cel === 'object' && typeof cel.f === 'string') ? '(fórmula)' : (cel == null ? '' : cel);
        return '<td>' + esc(v) + '</td>';
      }).join('') + '</tr>';
    });
    return html + '</tbody></table><p class="dica">Pré-visualização — as colunas de média, situação, presenças e entregues são calculadas por fórmula no arquivo .xlsx (e na planilha do Google).</p>';
  }

  function entregarResultado(kind, tipo, titulo, conteudo, fonte, padroesUsados) {
    if (kind === 'documento') {
      estado.resultado = { kind: kind, tipo: tipo, titulo: titulo, texto: conteudo, fonte: fonte, padroesUsados: padroesUsados || [] };
    } else {
      estado.resultado = { kind: kind, tipo: tipo, titulo: titulo, planilha: conteudo, fonte: fonte, padroesUsados: padroesUsados || [] };
    }
    var msg = (kind === 'documento' ? 'Pronto! Revise o texto abaixo, edite o que quiser e baixe em .docx' : 'Pronta! Confira a pré-visualização abaixo e baixe em .xlsx') +
      (estado.resultado.fonte === 'ia' ? ' — escrito pela IA real.' : ' — em modo demonstração, sem IA real.') +
      (padroesUsados && padroesUsados.length ? ' Usei valores padrão para: ' + padroesUsados.join('; ') + '.' : '');
    adicionarMensagem('brito', msg);
    mostrarResultado();
  }

  function gerar(kind, tipo, ctx) {
    var def = kind === 'planilha' ? TIPOS_PLANILHA[tipo] : TIPOS_DOC[tipo];
    var padroes = aplicarPadroes(tipo, kind, ctx);
    var pensando = adicionarMensagem('brito', 'Pensando… estou montando ' + (kind === 'planilha' ? 'a sua planilha' : 'o seu documento') + '.');
    var tituloBase = def.rotulo + ' — ' + (ctx.turma || ctx.disciplina || ctx.tema || 'Brittech Educação');
    if (modoIA() === 'demo') {
      setTimeout(function () {
        if (pensando) pensando.remove();
        if (kind === 'documento') {
          entregarResultado(kind, tipo, tituloBase, gerarDocumentoLocal(tipo, ctx), 'demo', padroes);
        } else {
          entregarResultado(kind, tipo, tituloBase, gerarPlanilhaLocal(tipo, ctx), 'demo', padroes);
        }
      }, 600);
      return Promise.resolve();
    }
    var prom = kind === 'documento' ? gerarDocumentoComIA(tipo, ctx) : gerarPlanilhaComIA(tipo, ctx);
    return prom.then(function (conteudo) {
      if (pensando) pensando.remove();
      entregarResultado(kind, tipo, tituloBase, conteudo, 'ia', padroes);
    }).catch(function (err) {
      if (pensando) pensando.remove();
      // IA falhou: cai no modelo local e avisa (mesmo padrão dos planos).
      var conteudoLocal = kind === 'documento' ? gerarDocumentoLocal(tipo, ctx) : gerarPlanilhaLocal(tipo, ctx);
      adicionarMensagem('brito', 'Não consegui usar a IA real (' + (err && err.message || err) + '). Montei pelo modelo local mesmo assim — revise antes de usar.');
      entregarResultado(kind, tipo, tituloBase, conteudoLocal, 'demo-erro', padroes);
    });
  }

  // Fluxo principal: recebe a mensagem do professor e decide — novo
  // pedido, resposta a pergunta, ou pedido incompleto.
  function processarMensagem(texto) {
    var msg = (texto || '').trim();
    if (!msg || estado.ocupado) return Promise.resolve();
    adicionarMensagem('voce', msg);
    var ctx = estado.pedido ? estado.pedido.ctx : {};
    extrairCampos(msg, ctx);
    if (!estado.pedido) {
      var det = detectarPedido(msg);
      if (!det) {
        adicionarMensagem('brito', 'Posso montar documentos (ata, relatório, parecer, ficha, planejamento anual, sequência didática, comunicado, lista de chamada) e planilhas (notas, frequência, planejamento por bimestre, controle de entregas). Me diga o que precisa — por exemplo: "faz uma ata da reunião de pais" ou "monta uma planilha de notas do 6º ano".');
        return Promise.resolve();
      }
      estado.pedido = { kind: det.kind, tipo: det.tipo, ctx: ctx };
      estado.rodada = 0;
    }
    var pedido = estado.pedido;
    var faltando = camposFaltando(pedido.tipo, pedido.kind, pedido.ctx);
    if (faltando.length && estado.rodada < MAX_RODADAS_PERGUNTAS) {
      var def = pedido.kind === 'planilha' ? TIPOS_PLANILHA[pedido.tipo] : TIPOS_DOC[pedido.tipo];
      estado.rodada++;
      var faltamNomes = faltando.map(function (c) {
        return { data: 'data', turma: 'turma', pauta: 'tipo de reunião', periodo: 'período', aluno: 'aluno(a)', disciplina: 'disciplina', tema: 'tema', assunto: 'assunto', alunos: 'nomes dos alunos', mes: 'mês', atividades: 'atividades', ano: 'ano/série' }[c] || c;
      }).join(', ');
      adicionarMensagem('brito', 'Entendi — ' + def.nome + '. Ainda falta: ' + faltamNomes + '. ' + def.pergunta);
      return Promise.resolve();
    }
    // Gerar (com os dados que tem; o que faltar vira valor padrão claro).
    estado.ocupado = true;
    var p = pedido;
    resetar(true);
    return gerar(p.kind, p.tipo, p.ctx).finally(function () { estado.ocupado = false; });
  }

  // ---------------------------------------------------------- Ações do resultado
  function baixarResultado() {
    var r = estado.resultado;
    if (!r) return;
    if (r.kind === 'documento') {
      var texto = $('agente-texto').value;
      baixarBlob(montarDocx(r.titulo, texto), slug(r.titulo) + '.docx');
      adicionarMensagem('brito', 'DOCX baixado — abra no Word, no LibreOffice ou no Google Docs para conferir e editar.');
    } else {
      baixarBlob(montarXlsx(r.titulo, r.planilha), slug(r.titulo) + '.xlsx');
      adicionarMensagem('brito', 'XLSX baixado — abra no Excel, no LibreOffice ou no Google Planilhas. As colunas de média e situação já vêm com fórmula.');
    }
  }
  function copiarResultado() {
    var r = estado.resultado;
    if (!r) return;
    var texto = r.kind === 'documento'
      ? $('agente-texto').value
      : [r.planilha.cabecalho.join('\t')].concat(r.planilha.linhas.map(function (l) {
          return l.map(function (c) { return (c && typeof c === 'object' && typeof c.f === 'string') ? '' : (c == null ? '' : c); }).join('\t');
        })).join('\n');
    var btn = $('agente-copiar');
    function feedback() {
      if (!btn) return;
      var orig = btn.textContent;
      btn.textContent = 'Copiado!';
      setTimeout(function () { btn.textContent = orig; }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(feedback).catch(feedback);
    } else { feedback(); }
  }
  function salvarNoGoogle() {
    var r = estado.resultado;
    if (!r) return;
    var g = hookGoogle();
    var btn = $('agente-google');
    if (!g) { adicionarMensagem('brito', 'Os conectores do Google não carregaram — recarregue a página e tente de novo.'); return; }
    if (!g.configurado()) {
      adicionarMensagem('brito', 'Para salvar no Google Drive, primeiro crie o OAuth Client ID — as instruções estão na aba “Planos e IA”, seção “Salvar no Drive — documentos e planilhas”. Enquanto isso, o arquivo baixa no seu computador.');
      return;
    }
    if (!g.conectado()) {
      adicionarMensagem('brito', 'Conecte o Google primeiro: vá na aba “Planos e IA”, seção “Salvar no Drive — documentos e planilhas”, e clique em “Conectar com o Google”.');
      return;
    }
    btn.disabled = true;
    var textoBtn = btn.textContent;
    btn.textContent = 'Salvando no Google…';
    var prom;
    if (r.kind === 'documento') {
      prom = g.criarGoogleDoc(r.titulo, $('agente-texto').value).then(function (res) {
        adicionarMensagem('brito', 'Salvo como Google Doc! Abra aqui: ' + res.url);
      });
    } else {
      prom = g.criarPlanilha(r.titulo, { aba: r.planilha.aba, linhas: [r.planilha.cabecalho].concat(r.planilha.linhas) }).then(function (res) {
        adicionarMensagem('brito', 'Salva como Google Planilha! Abra aqui: ' + res.url);
      });
    }
    prom.catch(function (err) {
      adicionarMensagem('brito', 'Não consegui salvar no Google: ' + (err && err.message || err) + ' O arquivo continua disponível para baixar.');
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = textoBtn;
    });
  }

  // ---------------------------------------------------------- Ligação (UI)
  function ligarUI() {
    var form = $('agente-form');
    if (form) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var input = $('agente-entrada');
        var v = input.value;
        input.value = '';
        processarMensagem(v);
      });
    }
    document.querySelectorAll('[data-exemplo-agente]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        processarMensagem(chip.dataset.exemploAgente);
      });
    });
    var btnNovo = $('agente-novo');
    if (btnNovo) {
      btnNovo.addEventListener('click', function () {
        resetar(false);
        var chat = elChat();
        if (chat) chat.innerHTML = '';
        var area = $('agente-resultado');
        if (area) area.hidden = true;
        adicionarMensagem('brito', 'Oi! Eu sou o Brito, seu assistente. Peça um documento ou uma planilha em linguagem natural — por exemplo: "faz uma ata da reunião de pais" ou "monta uma planilha de notas do 6º ano".');
      });
    }
    var btnCopiar = $('agente-copiar');
    if (btnCopiar) btnCopiar.addEventListener('click', copiarResultado);
    var btnBaixar = $('agente-baixar');
    if (btnBaixar) btnBaixar.addEventListener('click', baixarResultado);
    var btnGoogle = $('agente-google');
    if (btnGoogle) btnGoogle.addEventListener('click', salvarNoGoogle);
    // Quando o Google conecta/desconecta, atualiza o status no resultado.
    var g = hookGoogle();
    if (g && g.aoMudarEstado) {
      g.aoMudarEstado(function () {
        if (estado.resultado) mostrarResultado();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ligarUI);
  } else {
    ligarUI();
  }

  // ---------------------------------------------------------- Ganchos p/ testes
  window.__britoAgente = {
    versao: 'agente-1.0',
    detectarPedido: detectarPedido,
    extrairCampos: extrairCampos,
    camposFaltando: camposFaltando,
    gerarDocumentoLocal: gerarDocumentoLocal,
    gerarPlanilhaLocal: gerarPlanilhaLocal,
    montarDocx: montarDocx,
    montarXlsx: montarXlsx,
    processarMensagem: processarMensagem,
    getState: function () {
      return {
        pedido: estado.pedido ? { kind: estado.pedido.kind, tipo: estado.pedido.tipo, ctx: estado.pedido.ctx, rodada: estado.rodada } : null,
        resultado: estado.resultado ? { kind: estado.resultado.kind, tipo: estado.resultado.tipo, titulo: estado.resultado.titulo, fonte: estado.resultado.fonte, temTexto: !!(estado.resultado.texto || '').length, temPlanilha: !!estado.resultado.planilha } : null,
        ocupado: estado.ocupado,
      };
    },
    getResultado: function () { return estado.resultado; },
    reset: function () {
      resetar(false);
      var chat = elChat();
      if (chat) chat.innerHTML = '';
      var area = $('agente-resultado');
      if (area) area.hidden = true;
    },
    TIPOS_DOC: Object.keys(TIPOS_DOC),
    TIPOS_PLANILHA: Object.keys(TIPOS_PLANILHA),
    MAX_RODADAS_PERGUNTAS: MAX_RODADAS_PERGUNTAS,
  };
})();
