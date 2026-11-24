// Brittech Educação — exemplo de configuração da IA (NÃO cole sua chave
// neste arquivo de exemplo).
//
// COMO USAR (escolha UMA das duas formas):
//
// FORMA 1 (recomendada — sem mexer em arquivo): abra o MVP, vá na aba
// "Planos e IA", escolha o provedor (DeepSeek, Maritaca ou Gemini) e cole a
// chave no campo. Ela fica salva só no seu navegador (localStorage) e nunca
// vai para nenhum arquivo.
//
// FORMA 2 (arquivo de configuração):
//   1. Copie este arquivo para "config.js" (mesma pasta do index.html).
//   2. Em config.js, coloque a sua chave no campo do provedor, assim:
//        window.BRITTECH_CONFIG = { provedor: 'deepseek', deepseekApiKey: 'sk-...' };
//   3. Pronto — o MVP carrega config.js automaticamente ao abrir.
//   4. NUNCA envie config.js por e-mail/chat nem suba para repositório
//      público. Se a chave vazar, apague-a no painel do provedor e crie outra.
//
// Onde criar cada chave (detalhes no arquivo CONFIG.md):
//   DeepSeek: https://platform.deepseek.com/api_keys
//   Maritaca: https://plataforma.maritaca.ai (seção "Chaves de API")
//   Gemini:   https://aistudio.google.com/apikey

window.BRITTECH_CONFIG = {
  provedor: 'deepseek',
  deepseekApiKey: '', // <-- sua chave aqui (somente no config.js, nunca neste exemplo)
  maritacaApiKey: '',
  geminiApiKey: '',
  // URL do proxy da Brittech Educação (Render ou Cloudflare Workers — ver
  // ../proxy/README.md). Com ela preenchida, o MVP chama o proxy em vez da
  // API direta. Deixe '' para usar a chamada direta (modo antigo).
  proxyUrl: '', // ex.: 'https://brittech-proxy.onrender.com'
  // Client ID do Google (OAuth 2.0) para a integração com o Google Drive
  // (ver CONFIG.md, seção "Google Drive"). Deixe '' para configurar pelo
  // campo na aba "Planos e IA".
  googleClientId: '', // ex.: '123456789012-abcdefgh.apps.googleusercontent.com'
};
