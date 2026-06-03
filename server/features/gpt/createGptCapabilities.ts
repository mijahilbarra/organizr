import { UserProfile } from "../../types";
import { createUserCapabilities } from "../profile/createUserCapabilities";
import { isGmailConnectionActive } from "../profile/isGmailConnectionActive";
import { createGptActionUrl } from "./createGptActionUrl";

export function createGptCapabilities(profile: UserProfile | null) {
  const authenticated = Boolean(profile);
  const userCapabilities = profile ? createUserCapabilities(profile) : null;
  const gmailConnected = userCapabilities?.gmail.connected || isGmailConnectionActive(profile?.gmailConnection || null);
  const hasGemini = Boolean(userCapabilities?.llm.providers.gemini.available);
  const hasOpenAi = Boolean(userCapabilities?.llm.providers.openai.available);
  const hasCustomGpt = authenticated;
  const availableProviders = [
    hasGemini ? "gemini" : "",
    hasOpenAi ? "openai" : "",
    hasCustomGpt ? "customgpt" : "",
  ].filter(Boolean);
  const llmAvailable = availableProviders.length > 0;
  const nextSteps: string[] = [];

  if (!authenticated) {
    nextSteps.push("Sign in to Organizr with Firebase authentication.");
  }

  if (!gmailConnected) {
    nextSteps.push("Connect Gmail from the Organizr profile screen.");
  }

  return {
    authenticated,
    gmailConnected,
    llmAvailable,
    defaultProvider: userCapabilities?.llm.defaultProvider || (hasGemini ? "gemini" : hasOpenAi ? "openai" : hasCustomGpt ? "customgpt" : null),
    availableProviders,
    supportedProviderModes: ["auto", "gemini", "openai", "customgpt"],
    providers: {
      ...(userCapabilities?.llm.providers || {
        gemini: { available: false, source: null, actionCode: "CONFIGURE_GEMINI_API_KEY", actionUrl: createGptActionUrl("/profile") },
        openai: { available: false, source: null, actionCode: "CONFIGURE_OPENAI_API_KEY", actionUrl: createGptActionUrl("/profile") },
      }),
      customgpt: { available: hasCustomGpt, source: hasCustomGpt ? "chatgpt" : null, actionCode: hasCustomGpt ? null : "AUTH_REQUIRED", actionUrl: createGptActionUrl("/oauth/authorize") },
    },
    actionUrl: !gmailConnected ? createGptActionUrl("/profile") : createGptActionUrl("/extractors/create"),
    nextSteps,
    chatgpt: {
      state: authenticated && gmailConnected ? "available" : authenticated ? "missing" : "disabled",
      message: authenticated && gmailConnected
        ? "Custom GPT can create extractors, edit existing schema, append new subjects, and queue pending computed fields from the workspace."
        : !authenticated
          ? "Sign in to unlock Custom GPT actions."
          : "Connect Gmail to unlock Custom GPT actions.",
      actionCode: authenticated && gmailConnected ? "READY" : !authenticated ? "AUTH_REQUIRED" : "GMAIL_CONNECTION_REQUIRED",
      actionUrl: authenticated && gmailConnected ? createGptActionUrl("/extractors") : !authenticated ? createGptActionUrl("/oauth/authorize") : createGptActionUrl("/profile"),
      actions: [
        {
          code: "CREATE_EXTRACTOR",
          label: "Create extractor",
          actionUrl: createGptActionUrl("/extractors/create"),
          state: authenticated && gmailConnected ? "available" : "missing",
        },
        {
          code: "EDIT_EXTRACTOR",
          label: "Edit schema",
          actionUrl: createGptActionUrl("/extractors"),
          state: authenticated && gmailConnected ? "available" : "missing",
        },
        {
          code: "ADD_SUBJECT",
          label: "Add Gmail subject",
          actionUrl: createGptActionUrl("/extractors"),
          state: authenticated && gmailConnected ? "available" : "missing",
        },
      ],
    },
  };
}
