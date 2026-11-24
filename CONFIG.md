# CONFIG — Como ligar a IA real no MVP da Brittech Educação

> **Sem chave, o MVP funciona em modo demonstração, sem IA real**: os planos
> e as documentações são montados a partir de modelos por componente
> (arquivo `app.js`, funções `montarPlano` e `gerarRelatorio`/`gerarAta`/
> `gerarFicha`/`gerarParecer`). Com a chave de um provedor, a função
> `gerarPlanoComIA()` e a função `melhorarDocumentoComIA()` passam a chamar
> a API do provedor escolhido — **o mesmo motor escreve o plano e as
> documentações**. Nada aqui inventa, pede ou guarda chave nenhuma — a chave
> é sempre a do Thiago, colocada por ele, e nunca deve ser colada em nenhum
> arquivo que vá para repositório, e-mail ou chat.

## Provedores disponíveis

| Provedor | Modelo usado | Endpoint | Preço (por 1M de tokens) | Custo aprox. por plano de aula* |
|---|---|---|---|---|
| **DeepSeek** (recomendado p/ começar) | `deepseek-chat` | `https://api.deepseek.com/chat/completions` | entrada US$ 0,28 / saída US$ 0,42 (fonte: tabela de preços da DeepSeek, conferida em nov/2026 — os preços mudam; conferir na página oficial) | ≈ US$ 0,002 (≈ R$ 0,01) |
| **Maritaca** (melhor em português e documentos) | `sabia-4-thinking` | `https://chat.maritaca.ai/api/chat/completions` | entrada R$ 5,00 / saída R$ 40,00 (fonte: documentação oficial, https://docs.maritaca.ai/pt/precos, consultada em 24/11/2026 — bem mais caro que o S5, R$ 0,50 / R$ 2,50) | ≈ R$ 0,13 |
| **Gemini** (Google) | `gemini-2.5-flash-lite` | API nativa do Google (`generativelanguage.googleapis.com`) | nível gratuito — **mas nas contas do Thiago o nível sem custo não foi liberado** (o projeto “Brittech Educacao2a” avisa que o nível sem custo não está disponível e pede faturamento) | — |

\* Estimativa com ~2.000 tokens de entrada + ~3.000 de saída por plano. Um
documento reescrito pela IA custa parecido (um pouco menos). Valores
aproximados; conferir sempre na página oficial de preços de cada provedor.

**A Maritaca gera documentos? Sim.** Os modelos Sabiá foram treinados
para português e para o contexto brasileiro — a própria Maritaca destaca
análise e resumo de documentos longos (PDFs, contratos, legislação) e
geração de texto em português com alta fluência. O modelo em uso no MVP é o
**Sabiá 4 Thinking** (`sabia-4-thinking`), modelo de raciocínio da família
Sabiá (contexto de até 1M de tokens, saída de até 32K), indicado para
tarefas complexas que se beneficiam de raciocínio explícito antes da
resposta. Por isso o MVP usa o mesmo motor da Maritaca para reescrever
relatório, ata, ficha e parecer.

**Modelos mais baratos da Maritaca:** o `S5` (R$ 0,50 de entrada / R$ 2,50
de saída por 1M de tokens, ≈ R$ 0,01 por plano) é o modelo atual mais
barato e recomendado para começar; existiu também o `S5-free`, gratuito por
tempo limitado (oferta de lançamento, encerrada em 18/11/2026 segundo a
documentação). Para voltar ao `S5` no MVP, basta trocar a constante
`MARITACA_MODEL` em `app.js` de `'sabia-4-thinking'` para `'S5'`.

## 1. Criar a chave de cada provedor

### DeepSeek (recomendado para começar)

1. Abra https://platform.deepseek.com/ e crie/login na conta.
2. Vá em **API Keys** (https://platform.deepseek.com/api_keys) e crie uma chave.
3. Faça uma recarga mínima na plataforma (a API é pré-paga; a recarga mínima
   é pequena — ver o valor atual na página de recarga). Copie a chave, que
   começa com `sk-`.

### Maritaca

1. Abra https://plataforma.maritaca.ai/ e crie/login na conta.
2. Vá em **Chaves de API** e crie uma chave.
3. Novos usuários recebem R$ 20 em créditos da API ao cadastrarem um cartão
   ou fazerem a primeira recarga (mínimo R$ 5) — ver as condições atuais na
   plataforma. Copie a chave e guarde-a como uma senha.

### Gemini (Google)

1. Abra https://aistudio.google.com/apikey (login com a conta Google).
2. Clique em **Create API key** e copie a chave (começa com `AIza`).
3. **Atenção:** nas contas do Thiago o nível gratuito não liberou cota — o
   AI Studio avisa que o nível sem custo não está disponível para o projeto
   e pede para configurar faturamento no Google Cloud. Sem faturamento, a
   chave existe mas as chamadas falham por falta de cota.

## 2. Colocar a chave no MVP (escolha UMA forma)

### Forma A — pelo navegador (recomendada)

1. Abra `index.html` no navegador.
2. Vá na aba **Planos e IA**.
3. Escolha o provedor no seletor (DeepSeek, Maritaca ou Gemini).
4. Cole a chave no campo e clique em **Salvar chave neste navegador**.
5. O aviso no topo muda para **“IA real ativa (NomeDoProvedor modelo)”**.

Cada provedor tem sua própria chave salva (só no navegador, localStorage).
Você pode ter as 3 chaves salvas e trocar de provedor no seletor quando
quiser. Para remover a chave do provedor em uso, clique em **Remover chave**
na mesma aba — o MVP volta ao modo demonstração (para aquele provedor).

### Forma B — arquivo `config.js` (para quem abre o MVP em vários navegadores)

1. Abra o arquivo `config.js` (já existe nesta pasta, com as chaves vazias).
2. Coloque a chave no campo do provedor, ex.: `deepseekApiKey: 'sk-...'`.
3. Opcional: mude `provedor: 'deepseek'` para `'maritaca'` ou `'gemini'`.
4. Recarregue a página. O aviso muda para **“IA real ativa”**.

> **NUNCA** envie o `config.js` por e-mail ou chat, nem suba para GitHub.
> Se a chave vazar, apague-a no painel do provedor e crie outra.
> O arquivo `config.example.js` tem as chaves vazias, só para referência.

## 3. Testar a conexão

Na aba **Planos e IA**, botão **Testar conexão com a IA**. Ele manda um
“ok” para o provedor escolhido e mostra se respondeu. Se falhar (chave
inválida, sem internet, sem saldo/cota), o MVP avisa e continua gerando
planos e documentações em modo demonstração — nunca trava.

> **Atenção — chamadas diretas do navegador:** o Gemini aceita chamadas
> vindas direto do navegador. Já a DeepSeek e a Maritaca podem bloquear
> chamadas feitas direto da página (proteção CORS do navegador). Se o teste
> de conexão falhar com erro de rede mesmo com a chave certa, é esse o
> motivo — e a ligação definitiva precisa de um pequeno servidor (proxy)
> entre o MVP e a API, para a chave não ficar exposta no navegador. Isso é
> um passo da versão final da plataforma, não do MVP de testes.

## 3b. Modo proxy (recomendado — resolve o bloqueio CORS)

O proxy da Brittech Educação fica entre o MVP e a API: o navegador fala
só com o proxy, e é o proxy (no servidor) que chama a Maritaca/DeepSeek/
Gemini com a chave — que nunca sai do servidor. O deploy é no **Render,
plano gratuito** (ver `../proxy/README.md` para o passo a passo).

1. Depois de criar o serviço no Render, copie a URL dele
   (ex.: `https://brittech-proxy.onrender.com`).
2. No MVP, aba **Planos e IA**, cole essa URL no campo **“URL do proxy da
   Brittech Educação”** e clique em **Salvar URL do proxy** — ou preencha
   `proxyUrl` no `config.js`.
3. O aviso no topo muda para **“IA real ativa via proxy”** — mesmo sem
   chave neste navegador. Teste com o botão **Testar conexão com a IA**.

Sem proxy configurado, o MVP mantém o comportamento antigo (chamada
direta + fallback para o modo demonstração).

> **Render gratuito “dorme”:** depois de ~15 minutos sem uso, o serviço
> gratuito do Render desliga; a primeira chamada depois disso demora
> ~30–60 s para “acordar” (o plano pode demorar um pouco na primeira
> geração do dia). As chamadas seguintes são normais.

## 3c. Google Drive do professor (a IA usa os seus materiais)

Com isso, a IA escreve o plano e as documentações usando as suas
apostilas, planejamentos e textos do Drive como referência — no seu estilo
e com o seu conteúdo. A conexão é **só de leitura** (escopo
`drive.readonly`): nada é alterado nem apagado no Drive. O token de acesso
fica só na memória da aba do navegador e some ao fechar a página.

**O que você precisa criar (gratuito, uma vez só): um Client ID do Google
(OAuth 2.0).** Passo a passo, no Google Cloud Console
(https://console.cloud.google.com/ — login com a conta Google que vai
usar o Drive):

1. **Escolha ou crie o projeto.** No topo da página, clique no seletor de
   projeto. Você pode usar um projeto que já existe (ex.: o
   “Brittech Educacao2a”, usado para a chave do Gemini) ou criar um novo
   (“Brittech Educação”). Anote qual projeto escolheu.
2. **Ative a API do Google Drive.** Abra a Biblioteca de APIs em
   https://console.cloud.google.com/apis/library/drive.googleapis.com
   (ou: menu → **APIs e serviços → Biblioteca** → busque “Google Drive
   API”) e clique em **Ativar**. Sem isso, as chamadas ao Drive falham.
3. **Configure a tela de consentimento (OAuth).** Menu → **Google Auth
   Platform → Branding** (em versões antigas do console: **APIs e serviços
   → Tela de consentimento OAuth**). Preencha: **nome do app**
   “Brittech Educação”, **e-mail de suporte** (o seu) e **e-mail do
   desenvolvedor** (o seu). Em **Público-alvo (Audience)**, deixe
   **Externo (External)**.
   - **Atenção — modo de teste:** enquanto o app estiver em modo
     **Testing** (o padrão de apps novos), só as contas listadas em
     **Test users** conseguem conectar. Adicione o seu próprio e-mail
     (e o de quem mais for testar) em **Google Auth Platform → Audience →
     Test users**. Sem isso, o login falha com `access_blocked`. Publicar
     o app (botão **Publish app**) remove essa trava, mas pede a
     verificação do Google — para uso só seu, o modo de teste com o seu
     e-mail listado já basta.
   - Em **Escopos (Scopes)**, não é obrigatório adicionar nada aqui: o
     MVP pede o escopo `https://www.googleapis.com/auth/drive.readonly`
     na hora do login. Se o console pedir, adicione esse escopo
     (somente leitura do Drive).
4. **Crie o Client ID.** Menu → **Google Auth Platform → Clients**
   (em versões antigas: **APIs e serviços → Credenciais**) → **Create
   Client** → **Application type: Web application** → dê um nome, ex.:
   “Brittech Educação MVP”. Em **Authorized JavaScript origins**,
   clique em **Add URI** e coloque exatamente:
   `https://thiagollipe-web.github.io`
   (é a origem do site publicado; sem ela, o login é recusado). Para
   testar abrindo o MVP direto do computador, adicione também
   `http://localhost:8000` (só funciona se você servir a pasta com um
   servidor local, ex.: `python3 -m http.server 8000` dentro de `mvp/` —
   abrir por `file://` não funciona com o login do Google).
   **Não** é preciso preencher “Authorized redirect URIs”: o login usa
   a biblioteca Google Identity Services, que trabalha só com a origem
   autorizada. Clique em **Create** e copie o **Client ID** (termina em
   `.apps.googleusercontent.com`). O **Client secret não é usado** em
   apps web — não precisa dele.
5. **Cole o Client ID no MVP.** Abra o MVP, aba **Planos e IA**, seção
   **Google Drive**: cole o Client ID no campo e clique em **Salvar
   Client ID** — ou preencha `googleClientId` no `config.js`. (O Client
   ID identifica o app no Google e não é segredo; mesmo assim, só use o
   Client ID criado por você.)
6. **Conecte e escolha os materiais.** Clique em **Conectar Google
   Drive**, escolha a conta Google e autorize o acesso de leitura. Use a
   busca para achar seus arquivos (Docs, PDF, TXT e DOCX) e marque os
   que a IA deve usar. **Google Docs e TXT são lidos aqui dentro**; PDF
   e DOCX aparecem na lista, mas o navegador não extrai o texto deles —
   para usá-los, abra o arquivo no Google Docs (Arquivo → Abrir com →
   Documentos Google) ou salve uma cópia como .txt. O material
   selecionado aparece em “Material selecionado para a IA” e vai junto
   no próximo plano ou documento gerado com IA real. Para parar, clique
   em **Desconectar** (o token é revogado no Google).

**Limites e cuidados:**
- O token dura cerca de 1 hora; depois, é só clicar em “Conectar” de
  novo. O material selecionado fica marcado enquanto a aba estiver aberta.
- Por geração, o MVP envia no máximo 12.000 caracteres de material à IA
  (o restante é cortado e o corte é avisado). Material muito longo:
  selecione só as partes mais importantes.
- **Sem IA real ativa (modo demonstração), o material do Drive não é
  usado** — o modelo local não lê arquivos. O MVP avisa isso no plano
  gerado. O material só entra no prompt quando há provedor com chave ou
  proxy configurado.
- O token **nunca** é salvo em arquivo nem enviado ao proxy: ele fica só
  na memória do navegador. O proxy recebe apenas o prompt já montado,
  com o texto dos materiais selecionados.

## 3d. Assistente Brito — documentos e planilhas (e salvar no Google Drive)

A aba **“Assistente”** é um chat com o Brito para elaborar documentos e
planilhas em linguagem natural (arquivo `agente.js`):

- **Documentos:** relatório de turma, ata de reunião, ficha de avaliação,
  parecer descritivo, planejamento anual, sequência didática, comunicado
  aos pais e lista de chamada. Relatório, ata, ficha e parecer reutilizam
  os geradores locais de `app.js`; os demais têm modelos locais próprios
  em `agente.js`.
- **Planilhas:** notas (com média por fórmula), frequência, planejamento
  anual por bimestre e controle de atividades/entregas.
- **Como funciona:** o Brito detecta o tipo do pedido, pergunta o que
  falta (turma, datas, nomes, disciplina) em perguntas curtas — no máximo
  **2 rodadas** — e depois entrega. O que o professor não informar vira
  valor padrão claro (ex.: data de hoje, 5 linhas “Aluno 1” a “Aluno 5”),
  e o resultado avisa quais padrões foram usados.
- **Com IA real ativa** (mesmo motor dos planos — `chamarIA()` em
  `app.js`), o conteúdo é escrito pelo provedor escolhido. **Sem
  chave/proxy, gera a partir dos modelos locais** e mostra o aviso claro
  de “modo demonstração, sem IA real”.
- **Saída:** texto editável na tela + copiar + baixar **.docx** (documentos)
  ou **.xlsx** (planilhas) — geradores próprios em JavaScript puro, sem CDN
  e sem dependência externa (DOCX e XLSX são ZIPs de XMLs, mesmo padrão do
  gerador de PPTX em `slides.js`). O .xlsx traz a média por fórmula
  (`AVERAGE`) e a situação por `IF`. Os arquivos foram validados com
  `python-docx` e `openpyxl` (ver `../mvp-testes/test-agente.js`).

### Salvar no Google Drive (Docs e Planilhas)

O botão **“Salvar como Google Doc”** / **“Salvar como Google Planilha”**
cria o arquivo no Drive do professor, via Google Docs API e Google
Sheets API (arquivo `google.js`). É o **mesmo login Google** da seção
“Google Drive do professor” (seção 3c): o mesmo Client ID serve para os
dois — a diferença são as permissões pedidas em cada login:

| Permissão (escopo) | O que faz | Usada por |
|---|---|---|
| `https://www.googleapis.com/auth/drive.readonly` | Ler arquivos do Drive (só leitura) | Seção 3c — a IA usa os materiais como referência |
| `https://www.googleapis.com/auth/drive.file` | Criar arquivos no Drive do professor (só os criados por este app) | Salvar documentos e planilhas do assistente |
| `https://www.googleapis.com/auth/documents` | Criar e escrever em Google Docs | “Salvar como Google Doc” |
| `https://www.googleapis.com/auth/spreadsheets` | Criar e escrever em Google Planilhas | “Salvar como Google Planilha” |
| `openid` + `email` | Mostrar qual conta Google está conectada | Status “Conectado como …” |

Detalhes técnicos: o login usa a biblioteca Google Identity Services,
carregada sob demanda de `https://accounts.google.com/gsi/client` (fonte:
https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).
O token de acesso fica **só na sessão do navegador** (`sessionStorage`) e
some ao fechar a aba — nunca vai para arquivo nenhum. O token de leitura
do Drive (seção 3c) fica só na memória da aba; são dois tokens separados,
um para ler e um para salvar.

**Para ligar (mesmo Client ID da seção 3c — não precisa criar outro):**

1. No mesmo projeto do Google Cloud Console
   (https://console.cloud.google.com/), ative também a **Google Docs API**
   e a **Google Sheets API**: menu → **APIs e serviços → Biblioteca**
   (https://console.cloud.google.com/apis/library) → busque “Google Docs
   API” e “Google Sheets API” → **Ativar** em cada uma. (A Google Drive
   API já foi ativada na seção 3c.) IDs dos serviços, para referência:
   `docs.googleapis.com` e `sheets.googleapis.com`.
2. Se o app ainda estiver em modo de teste, o escopo novo pode pedir que
   você autorize de novo na tela de consentimento — é só clicar em
   **Conectar com o Google** e aceitar. Não é preciso criar outro Client
   ID nem mudar as origens autorizadas: são as mesmas da seção 3c.
3. No MVP, aba **Planos e IA**, seção **“Salvar no Drive — documentos e
   planilhas do assistente”**, clique em **Conectar com o Google** e
   autorize. Depois, na aba **Assistente**, gere um documento ou planilha
   e clique em **Salvar como Google Doc** / **Salvar como Google
   Planilha** — o Brito devolve o link do arquivo criado no seu Drive.

**Limites e cuidados:**
- O login Google só funciona com o MVP servido por **HTTPS** (ex.: a
  origem `https://thiagollipe-web.github.io` cadastrada na seção 3c) —
  abrindo o arquivo direto do computador (`file://`), o Google recusa o
  login e os botões mostram a instrução, sem quebrar a página.
- O token dura cerca de 1 hora; depois, é só clicar em “Conectar” de
  novo. “Desconectar” revoga o token no Google.
- O OAuth real (login + salvar Doc/Planilha) **ainda não foi testado de
  ponta a ponta** — falta o Client ID real do Thiago. O que foi testado:
  geração em modo demonstração, .docx/.xlsx válidos e o fluxo sem Client
  ID (instrução mostrada, página sem erros). Ver
  `../mvp-testes/test-agente.js`.

## 4. O que ainda falta para a IA “completa”

- **Slides da aula:** módulo pronto (aba “Slides da aula”, arquivo
  `slides.js`). Com IA ativa, o roteiro dos 8 slides é escrito pelo
  provedor escolhido (resposta em JSON validada); sem chave, usa o modelo
  local. Exportação PPT (.pptx de verdade, gerador próprio sem CDN) e PDF
  (um slide por página). As imagens são ilustrações SVG originais — a
  geração de imagem por IA ainda não está ligada (ver README, seção
  “Imagens nos slides”).
- **IA com acesso ao Google Drive (incluso em todas as durações):**
  implementado — ver seção 3c acima. Exige o Client ID do Google
  (OAuth) criado pelo Thiago no Google Cloud Console; sem o Client ID,
  a seção mostra as instruções e não quebra nada. O OAuth real ainda
  não foi testado de ponta a ponta (falta o Client ID real).
- **Assistente Brito (documentos e planilhas) + salvar no Google Drive:**
  implementado — ver seção 3d acima. O OAuth real de salvar (login +
  criar Doc/Planilha) ainda não foi testado de ponta a ponta — falta o
  Client ID real do Thiago.
- **Prompt por componente:** hoje o prompt é único; dá para especializar por
  componente/ano depois que o Thiago testar os primeiros planos gerados.
- **Histórico de planos na nuvem:** hoje os planos gerados não são salvos
  (só o contador mensal, no navegador). Salvar o histórico exige conta de
  usuário + banco de dados — fora do escopo do MVP.
- **Servidor/proxy para as chaves:** pronto — ver `../proxy/` (deploy no
  Render gratuito). Com o proxy configurado, as chaves ficam só no
  servidor; a chave no navegador continua funcionando como modo de teste,
  mas o caminho de produção é o proxy.
