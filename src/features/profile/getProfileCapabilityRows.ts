import { UserCapabilityState, UserProfile } from "../../types";

interface GmailConnectionStatus {
  isActive: boolean;
}

export interface ProfileCapabilityRow {
  id: "gmail" | "gemini" | "openai" | "chatgpt";
  label: string;
  state: UserCapabilityState;
  message: string;
  actionUrl?: string;
}

export function getProfileCapabilityRows(
  profile: UserProfile | null,
  gmailStatus: GmailConnectionStatus,
): ProfileCapabilityRow[] {
  const capabilities = profile?.capabilities || {};
  const gmailConnected = capabilities.gmail?.connected ?? gmailStatus.isActive;
  const geminiProvider = capabilities.llm?.providers.gemini;
  const openAiProvider = capabilities.llm?.providers.openai;

  return [
    {
      id: "gmail",
      label: "Gmail",
      state: gmailConnected ? "available" : "missing",
      message: gmailConnected
        ? "Inbox search is connected for extractor workflows."
        : "Connect Gmail to let workspace and GPT flows search inbox samples.",
      actionUrl: capabilities.gmail?.actionUrl,
    },
    {
      id: "gemini",
      label: "Gemini",
      state: geminiProvider ? (geminiProvider.available ? "available" : "missing") : "unknown",
      message: geminiProvider
        ? geminiProvider.available
          ? `Gemini is available${geminiProvider.source ? ` from ${geminiProvider.source} configuration` : ""}.`
          : "Configure a Gemini API key to use Gemini explicitly."
        : "Waiting for backend capability detection.",
      actionUrl: geminiProvider?.actionUrl,
    },
    {
      id: "openai",
      label: "OpenAI",
      state: openAiProvider ? (openAiProvider.available ? "available" : "missing") : "unknown",
      message: openAiProvider
        ? openAiProvider.available
          ? `OpenAI is available${openAiProvider.source ? ` from ${openAiProvider.source} configuration` : ""}.`
          : "Configure an OpenAI API key to use OpenAI explicitly."
        : "Waiting for backend capability detection.",
      actionUrl: openAiProvider?.actionUrl,
    },
    {
      id: "chatgpt",
      label: "ChatGPT Actions",
      state: capabilities.chatgpt?.state || "unknown",
      message: capabilities.chatgpt?.message || "Custom GPT can create extractors, add more subjects, and edit schema for saved extractors.",
      actionUrl: capabilities.chatgpt?.actionUrl,
    },
  ];
}
