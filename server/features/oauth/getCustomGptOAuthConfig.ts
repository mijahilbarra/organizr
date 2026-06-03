export function getCustomGptOAuthConfig() {
  return {
    clientId: process.env.CUSTOM_GPT_OAUTH_CLIENT_ID || "organizr-custom-gpt",
    clientSecret: process.env.CUSTOM_GPT_OAUTH_CLIENT_SECRET || "organizr-custom-gpt-secret",
    defaultScope: process.env.CUSTOM_GPT_OAUTH_SCOPE || "profile gmail extractors",
  };
}
