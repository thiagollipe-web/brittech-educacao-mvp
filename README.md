# Brittech Educação — MVP do planejador de aulas com IA

**Slogan:** “Sua aula pronta, do planejamento à prática.”

MVP construído a partir do protótipo em `../prototipo/` (não alterado).
Sem dependências externas: HTML + CSS + JavaScript puro, tudo em português.

## Como abrir

Abra `index.html` no navegador (duplo clique, ou sirva a pasta com qualquer
servidor estático, ex.: `python3 -m http.server` dentro de `mvp/`).

## O que tem neste MVP

1. **Gerador de plano de aula** (aba 1) — etapa → componente/área → ano/série
   → habilidade BNCC → tema → duração. Plano estruturado com objetivos,
   habilidade BNCC, desenvolvimento com tempos, atividades, avaliação,
   recursos e adaptações. Botões copiar e imprimir/salvar em PDF.
2. **Mascote Brito reagindo** — saudação na tela inicial, pensando enquanto
   gera (com pequena espera simulada), comemorando quando o plano fica pronto.
3. **Documentações** (aba 2) — a partir do plano gerado: relatório de turma,
   ata de reunião, ficha de avaliação e parecer descritivo. Cada um com botão
   de copiar e botão de imprimir/salvar em PDF. Textos editáveis antes de
   copiar/imprimir.
4. **IA real com 3 provedores** — na aba “Planos e IA” há um seletor de
   provedor: **DeepSeek** (`deepseek-chat`, recomendado para começar),
   **Maritaca** (`sabia-4-thinking`, modelo de raciocínio, melhor em português e em documentos) e **Gemini**
   (`gemini-2.5-flash-lite`, sem cota gratuita nas contas do Thiago).
   Cada provedor tem sua própria chave (só no navegador). O mesmo motor
   escreve o **plano de aula** (`gerarPlanoComIA()`) e reescreve as
   **documentações** (`melhorarDocumentoComIA()`): ao gerar as 4
   documentações com IA ativa, cada texto é reescrito pelo provedor
   escolhido; cada documento também tem o botão “Melhorar com IA”.
   Sem chave, usa os modelos locais e avisa claramente **“modo
   demonstração, sem IA real”**. Como configurar cada chave: ver
   `CONFIG.md`. Nenhuma chave foi criada, inventada ou gravada aqui.
   Atenção: DeepSeek e Maritaca podem bloquear chamadas diretas do
   navegador (CORS) — o caminho definitivo é o **proxy da Brittech
   Educação** (`../proxy/`, deploy no Render gratuito): com a URL do
   proxy configurada (campo na aba “Planos e IA” ou `proxyUrl` no
   `config.js`), a chave fica só no servidor e o bloqueio some.
   Ver `CONFIG.md`, seção 3b.
5. **Planos** (aba 4) — um acesso só, completo, em 3 durações: Mensal
   R$ 29,90/mês, Trimestral R$ 74,90 a cada 3 meses, Anual R$ 299/ano.
   Todas as durações têm os mesmos recursos e o mesmo limite de
   100 planos/mês. Contador mensal no topo (salvo no navegador); ao atingir
   o limite, a geração pausa até o próximo mês (não há upgrade que libere
   mais planos — o limite é o mesmo nas 3 durações). **IA com acesso ao
   seu Google Drive** (incluso em todas as durações): na mesma aba, seção
   “Google Drive” — conecte o Drive (login Google, só leitura) e selecione
   apostilas e planejamentos para a IA usar como referência ao escrever o
   plano e as documentações. Precisa do Client ID do Google (OAuth) —
   passo a passo em `CONFIG.md`, seção “Google Drive”. Sem Client ID, a
   seção mostra as instruções e não quebra nada.
6. **Catálogo BNCC** (aba 3) — busca por código, componente ou palavra.
   112 habilidades de exemplo. Habilidades com status “a confirmar” são
   sinalizadas e nunca têm a descrição inventada.
7. **Slides da aula** (aba 4) — a partir do plano gerado, monta uma
   apresentação de **6 a 33 slides** (quantidade escolhida pelo professor
   no campo “Quantidade de slides”, padrão: 8) no estilo de apresentação
   gerada por IA (tipo Gemini Notebook): título curto e forte, pouco texto
   por slide (frases curtas e pontos-chave, no máximo 4 por slide), um
   elemento visual por slide (diagrama, quadro, linha do tempo, comparação
   ou destaque numerado), notas do apresentador em cada slide e uma imagem
   por slide de conteúdo. Estrutura: capa (tema + habilidade BNCC) →
   objetivos → slides de conteúdo com exemplos (de 1 a 28, conforme a
   quantidade pedida, cada um com um ângulo diferente e sem repetir) →
   atividade prática → resumo → fechamento/avaliação. Se a IA devolver
   contagem ou estrutura errada, o roteiro é normalizado para a quantidade
   exata com o modelo local. Navegação por botões, setas do teclado e tela
   cheia; botão para mostrar/ocultar as notas. Exportação: **Baixar PPT
   (.pptx)** — arquivo .pptx de verdade, gerado por código próprio em
   JavaScript puro (sem CDN, sem dependência externa), com título, pontos,
   visual, ilustrações e notas do apresentador em cada slide; e **Baixar
   PDF** — impressão dos slides, um por página em paisagem (via
   `window.print()`, escolha “Salvar como PDF”). Com IA ativa, o roteiro
   dos slides é escrito pela IA do provedor escolhido (`gerarSlidesComIA()`
   em `slides.js`, resposta em JSON validada); sem chave, usa o modelo
   local e avisa o modo demonstração. **Sem Brito nos slides** (decisão do
   Thiago): a única marca é a marca d'água discreta “Brittech Educação” no
   canto inferior direito de cada slide, além da paleta e da tipografia.
   As imagens são **ilustrações originais em SVG** desenhadas no código
   (`slides.js`, `ILUSTRACOES`: livro, números, experimento, mapa, linha
   do tempo, paleta, diálogo, movimento, lupa) — nunca foto de banco de
   imagem com pessoas reais e nunca imagem de menor de idade. Ver
   `../mvp-testes/test-slides.js` (84/84 testes: 8 slides padrão por
   etapa, 33 slides, mínimo de 6 e limites).
8. **Assistente Brito — documentos e planilhas** (aba “Assistente”) —
   chat em português: o professor pede em linguagem natural (“faz uma ata
   da reunião de pais”, “monta uma planilha de notas do 6º ano”) e o Brito
   detecta o tipo, pergunta o que falta (no máximo 2 rodadas de perguntas
   curtas) e entrega o resultado editável. **Documentos:** relatório de
   turma, ata, parecer, ficha, planejamento anual, sequência didática,
   comunicado aos pais e lista de chamada — saída em texto editável +
   copiar + baixar **.docx** (gerador próprio em JS puro, sem CDN).
   **Planilhas:** notas (média por fórmula), frequência, planejamento por
   bimestre e controle de entregas — saída em **.xlsx** (gerador próprio
   em JS puro, sem CDN). Com IA real ativa, o conteúdo é escrito pelo
   provedor escolhido; sem chave, usa os modelos locais e avisa o modo
   demonstração. Com o Google conectado (seção “Salvar no Drive” na aba
   “Planos e IA”), o botão **Salvar como Google Doc / Google Planilha**
   cria o arquivo no Drive do professor. Ver `CONFIG.md`, seção 3d, e
   `../mvp-testes/test-agente.js`.

## Arquivos

| Arquivo | O quê |
|---|---|
| `index.html` | Estrutura das 6 abas |
| `style.css` | Visual (paleta azul-marinho/ciano/verde-limão) + regras de impressão (documentos e slides) |
| `app.js` | Lógica: gerador, IA, documentações, planos, catálogo + integração Google Drive (leitura) |
| `agente.js` | Assistente Brito: chat, detecção do pedido, modelos locais de documentos e planilhas, geradores .docx e .xlsx próprios (sem CDN) |
| `google.js` | Conectores Google: login OAuth (Google Identity Services) + criar Google Docs e Google Planilhas no Drive do professor |
| `slides.js` | Módulo de slides: roteiro (local ou IA), apresentação em HTML, exportação PPTX (gerador próprio, sem CDN) e PDF |
| `bncc.js` | Catálogo BNCC embutido (gerado de `bncc.json`) |
| `bncc.json` | Catálogo BNCC original (fonte) |
| `config.js` | Configuração das chaves (DeepSeek, Maritaca e Gemini — vazias por padrão) e do Client ID do Google (`googleClientId`, vazio por padrão — ver `CONFIG.md`) |
| `config.example.js` | Modelo de `config.js`, só para referência |
| `CONFIG.md` | Como ligar a IA real, passo a passo |
| `assets/` | Logo + mascote Brito (3 poses, SVG) |

## Imagens nos slides (e como ligar imagens geradas por IA depois)

As imagens dos slides de conteúdo são **ilustrações originais em SVG**,
desenhadas no arquivo `slides.js` (constante `ILUSTRACOES`), no estilo da
marca — livro, números, experimento, mapa, linha do tempo, paleta, diálogo,
movimento e lupa. A imagem é escolhida pelo componente da BNCC (ex.:
Língua Portuguesa → livro; Matemática → números; Ciências → experimento;
Geografia → mapa) e vai junto nas exportações: no PPT ela entra como PNG
(o SVG é convertido para PNG por canvas antes de entrar no .pptx, pois o
PPTX não embute SVG) e no PDF ela aparece na impressão do slide. Nunca é
usada foto de banco de imagem com pessoas reais e nunca imagem de menor de
idade.

**Imagens geradas por IA (futuro):** a geração de imagem por IA não está
ligada neste MVP. Para ligar depois: (1) escolher um serviço de geração de
imagem com API (ex.: o modelo de imagem do provedor escolhido); (2) gerar
a imagem a partir do conceito do slide e guardá-la como PNG/JPG; (3) no
`slides.js`, trocar a entrada de `ILUSTRACOES` correspondente (ou o campo
`imagem` do slide) pela imagem gerada — o resto do fluxo (apresentação,
PPT e PDF) já aceita qualquer imagem, pois o PPT recebe PNG e o HTML
aceita a imagem embutida. Atenção: nunca gerar imagem com pessoas reais
nem com menores de idade; prefira ilustrações no estilo da marca.

## "Adaptar com IA" (biblioteca gratuita de aulas)

O MVP aceita parâmetros na URL que pré-preenchem o formulário do gerador
(`app.js`, bloco `adaptarComIAViaUrl` no fim do arquivo):

```
?etapa=fundamental-anos-finais&componente=Ciências&ano=6º ano&habilidade=EF06CI01&tema=Misturas...&duracao=50
```

É o que o botão “Adaptar com IA” de cada aula da biblioteca gratuita
(`../aulas-gratuitas/`) usa. Para funcionar no site publicado, o `app.js`
atualizado precisa ser republicado no repositório `brittech-educacao-mvp`.

## Testes (verificação do MVP)

Ver `../mvp-testes/` (script de teste automatizado em Chromium headless) e
o relatório de verificação entregue junto com o MVP.

## O que NÃO foi feito (fora do escopo / pendente)

- Nenhuma publicação, nenhuma alteração na Kiwify, nenhum faturamento cadastrado
  por este MVP. (Na Kiwify existem, cadastradas em 23/11/2026: Mensal
  https://pay.kiwify.com.br/73DKMc0, Trimestral R$ 74,90
  https://pay.kiwify.com.br/QrSvkxs e Anual https://pay.kiwify.com.br/5CYtPPb.
  O produto antigo “Pro” R$ 49,90/mês (https://pay.kiwify.com.br/fceMxtZ) foi
  substituído pela nova estrutura de um acesso só; cabe ao Thiago decidir se
  mantém ou desativa esse produto na Kiwify. Este MVP não alterou nem vinculou
  nenhuma assinatura.)
- IA real desligada por padrão (falta a chave do Thiago — ver `CONFIG.md`).
- “IA com acesso ao seu Google Drive”: implementado no MVP (seção
  “Google Drive” na aba “Planos e IA”), mas o OAuth real ainda não foi
  testado de ponta a ponta — falta o Client ID do Google, que o Thiago
  precisa criar no Google Cloud Console (passo a passo em `CONFIG.md`,
  seção “Google Drive”).
- “Salvar no Google Drive” do assistente Brito (criar Google Doc e Google
  Planilha): implementado no MVP, mas o OAuth real de salvar também ainda
  não foi testado de ponta a ponta — usa o mesmo Client ID da seção
  “Google Drive” (passo a passo em `CONFIG.md`, seção 3d). Testado: modo
  demonstração, .docx/.xlsx válidos e fluxo sem Client ID.
- Histórico de planos não é salvo; contador mensal fica só no navegador.
- Busca de anterioridade de marca no INPI já foi feita antes (ver memória do
  projeto); nenhum pedido de registro foi protocolado.
