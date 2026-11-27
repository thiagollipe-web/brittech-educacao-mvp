// Brittech Educação — configuração da IA (arquivo local, chaves vazias por padrão).
//
// COMO USAR (escolha UMA das duas formas):
//
// FORMA 1 (recomendada — sem mexer em arquivo): abra o MVP, vá na aba
// "Planos e IA", escolha o provedor (DeepSeek, Maritaca ou Gemini) e cole a
// chave no campo. Ela fica salva só no seu navegador (localStorage) e nunca
// vai para nenhum arquivo.
//
// FORMA 2 (arquivo de configuração): coloque a sua chave abaixo, no campo
// do provedor que vai usar, assim: deepseekApiKey: 'sk-...'
//   ATENÇÃO: NUNCA envie este arquivo por e-mail/chat nem suba para
//   repositório público. Se a chave vazar, apague-a no painel do provedor
//   e crie outra.
//
// Onde criar cada chave (detalhes completos no arquivo CONFIG.md):
//   DeepSeek: https://platform.deepseek.com/api_keys
//   Maritaca: https://plataforma.maritaca.ai (seção "Chaves de API")
//   Gemini:   https://aistudio.google.com/apikey

window.BRITTECH_CONFIG = {
  provedor: 'deepseek', // provedor padrão ao abrir o MVP: 'deepseek', 'maritaca' ou 'gemini'
  deepseekApiKey: '',   // <-- sua chave do DeepSeek aqui (somente neste arquivo local)
  maritacaApiKey: '',   // <-- sua chave da Maritaca aqui
  geminiApiKey: '',     // <-- sua chave do Gemini aqui (somente neste arquivo local)
  // URL do proxy da Brittech Educação (Render ou Cloudflare Workers — ver
  // ../proxy/README.md). Com ela preenchida, o MVP chama o proxy em vez da
  // API direta: a chave fica só no servidor, nunca neste navegador, e o
  // bloqueio CORS some. Deixe '' para usar a chamada direta (modo antigo).
  proxyUrl: 'https://brittech-proxy.duckdns.org', // ex.: 'https://brittech-proxy.duckdns.org'
  // Client ID do Google (OAuth 2.0) para a integração com o Google Drive
  // (ver CONFIG.md, seção "Google Drive"). Termina em
  // '.apps.googleusercontent.com'. O Client ID identifica o app no Google
  // e NÃO é segredo — mesmo assim, só coloque aqui o Client ID criado por
  // você no Google Cloud Console; nunca invente um valor. Deixe '' para
  // configurar pelo campo na aba "Planos e IA" (o valor fica salvo só no
  // seu navegador).
  googleClientId: '',   // ex.: '123456789012-abcdefgh.apps.googleusercontent.com'
};
