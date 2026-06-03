import { UserProfile } from "../../types";
import { isGmailConnectionActive } from "./isGmailConnectionActive";

export function createUserCapabilities(profile: UserProfile) {
  const hasUserGeminiKey = !!profile.llmSettings.geminiApiKey;
  const hasUserOpenAiKey = !!profile.llmSettings.openAiApiKey;
  const hasServerGeminiKey = !!process.env.GEMINI_API_KEY;
  const hasServerOpenAiKey = !!process.env.OPEN_AI_KEY || !!process.env.OPENAI_API_KEY;
  const hasGemini = hasUserGeminiKey || hasServerGeminiKey;
  const hasOpenAi = hasUserOpenAiKey || hasServerOpenAiKey;

  return {
    gmail: {
      connected: isGmailConnectionActive(profile.gmailConnection),
      actionCode: isGmailConnectionActive(profile.gmailConnection) ? null : "CONNECT_GMAIL",
      actionUrl: "/profile",
    },
    llm: {
      defaultProvider: profile.llmSettings.defaultProvider,
      providers: {
        gemini: {
          available: hasGemini,
          source: hasUserGeminiKey ? "user" : hasServerGeminiKey ? "server" : null,
          actionCode: hasGemini ? null : "CONFIGURE_GEMINI_API_KEY",
          actionUrl: "/profile",
        },
        openai: {
          available: hasOpenAi,
          source: hasUserOpenAiKey ? "user" : hasServerOpenAiKey ? "server" : null,
          actionCode: hasOpenAi ? null : "CONFIGURE_OPENAI_API_KEY",
          actionUrl: "/profile",
        },
      },
      hasAnyProvider: hasGemini || hasOpenAi,
      actionCode: hasGemini || hasOpenAi ? null : "CONFIGURE_LLM_PROVIDER",
      actionUrl: "/profile",
    },
  };
}
