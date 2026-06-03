import React, { useEffect, useState } from "react";
import { BarChart3, Bot, CheckCircle2, MailCheck, MailX, Save, SlidersHorizontal, UserRound, XCircle } from "lucide-react";
import { LlmConsumeMonth, LlmProviderPreference, UserProfile } from "../../types";
import { createConsumeMonthKey } from "./createConsumeMonthKey";
import { getAvailableLlmProviderCount } from "./getAvailableLlmProviderCount";
import { getCapabilityStatusLabel } from "./getCapabilityStatusLabel";
import { getGmailConnectionStatus } from "./getGmailConnectionStatus";
import { getProfileCapabilityRows } from "./getProfileCapabilityRows";

interface ProfileSlideProps {
  profile: UserProfile | null;
  isSaving: boolean;
  onUpdateProfile: (updates: {
    displayName: string;
    photoURL: string;
    llmSettings?: {
      defaultProvider?: LlmProviderPreference;
      geminiApiKey?: string;
      openAiApiKey?: string;
    };
  }) => Promise<void>;
  onConnectGmail: () => Promise<void>;
  onRevokeGmail: () => Promise<void>;
}

export const ProfileSlide: React.FC<ProfileSlideProps> = ({
  profile,
  isSaving,
  onUpdateProfile,
  onConnectGmail,
  onRevokeGmail,
}) => {
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || "");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [openAiApiKey, setOpenAiApiKey] = useState("");

  useEffect(() => {
    setDisplayName(profile?.displayName || "");
    setPhotoURL(profile?.photoURL || "");
    setGeminiApiKey("");
    setOpenAiApiKey("");
  }, [profile]);

  const gmailStatus = getGmailConnectionStatus(profile);
  const profilePhotoURL = photoURL.trim();
  const profileTitle = displayName.trim() || profile?.email || "Profile";
  const consumeRows = (Object.entries(profile?.llmConsumeByMonth || {}) as [string, LlmConsumeMonth][])
    .sort(([monthA], [monthB]) => monthB.localeCompare(monthA));
  const totalLlmRequests = consumeRows.reduce((total, [, consume]) => total + consume.requestCount, 0);
  const capabilityRows = getProfileCapabilityRows(profile, gmailStatus);
  const availableProviderCount = getAvailableLlmProviderCount(profile);
  const defaultLlmProvider = profile?.llmSettings?.defaultProvider || profile?.capabilities?.llm?.defaultProvider || profile?.defaultLlmProvider || "auto";

  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6" id="profile-slide">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 overflow-hidden">
          {profilePhotoURL ? (
            <img
              src={profilePhotoURL}
              alt={profileTitle}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <UserRound className="w-6 h-6" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Profile</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">{profile?.email || "Authenticated user"}</p>
        </div>
      </div>

      <form
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onUpdateProfile({ displayName, photoURL });
        }}
      >
        <label className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Display name</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Photo URL</span>
          <input
            value={photoURL}
            onChange={(event) => setPhotoURL(event.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl px-4 py-2.5 disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save profile"}</span>
          </button>
        </div>
      </form>

      <div className="border-t border-slate-100 pt-5 space-y-4">
        <div className="flex items-start gap-3">
          <Bot className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Connection readiness</h3>
            <p className="text-xs text-slate-500 mt-1">
              Workspace, Gmail, model provider, and Custom GPT readiness are shown independently.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {capabilityRows.map((capability) => {
            const isReady = capability.state === "available";
            const isMissing = capability.state === "missing";

            return (
              <div key={capability.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {isReady ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : isMissing ? (
                      <XCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs font-extrabold text-slate-800 truncate">{capability.label}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                    isReady ? "text-green-700" : isMissing ? "text-amber-700" : "text-slate-400"
                  }`}>
                    {getCapabilityStatusLabel(capability.state)}
                  </span>
                </div>
                <p className="text-[11px] leading-5 text-slate-500 mt-2">{capability.message}</p>
                {capability.actionUrl && (
                  <a
                    href={capability.actionUrl}
                    className="inline-flex text-[11px] font-bold text-indigo-600 hover:text-indigo-700 mt-2"
                  >
                    Open setup
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5 space-y-3">
        <div className="flex items-start gap-3">
          <SlidersHorizontal className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Default model provider</h3>
            <p className="text-xs text-slate-500 mt-1">
              Auto keeps workflows available when the backend can choose between configured providers.
            </p>
          </div>
        </div>
        <select
          value={defaultLlmProvider}
          disabled={isSaving || availableProviderCount < 2}
          onChange={(event) => {
            onUpdateProfile({
              displayName,
              photoURL,
              llmSettings: { defaultProvider: event.target.value as LlmProviderPreference },
            });
          }}
          className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
        >
          <option value="auto">Auto</option>
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI</option>
        </select>
        {availableProviderCount < 2 && (
          <p className="text-[11px] leading-5 text-slate-500">
            Provider selection unlocks when backend capabilities report more than one available LLM provider.
          </p>
        )}
      </div>

      <form
        className="border-t border-slate-100 pt-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onUpdateProfile({
            displayName,
            photoURL,
            llmSettings: {
              geminiApiKey,
              openAiApiKey,
            },
          });
        }}
      >
        <div className="flex items-start gap-3">
          <Bot className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Provider keys</h3>
            <p className="text-xs text-slate-500 mt-1">
              Saved keys stay server-side. Leave a field empty to keep the current value unchanged.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Gemini API key</span>
            <input
              value={geminiApiKey}
              onChange={(event) => setGeminiApiKey(event.target.value)}
              placeholder={profile?.llmSettings?.hasGeminiApiKey ? "Configured" : "Not configured"}
              type="password"
              autoComplete="off"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">OpenAI API key</span>
            <input
              value={openAiApiKey}
              onChange={(event) => setOpenAiApiKey(event.target.value)}
              placeholder={profile?.llmSettings?.hasOpenAiApiKey ? "Configured" : "Not configured"}
              type="password"
              autoComplete="off"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={isSaving || (!geminiApiKey.trim() && !openAiApiKey.trim())}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl px-4 py-2.5 disabled:opacity-60 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving..." : "Save provider keys"}</span>
        </button>
      </form>

      <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {gmailStatus.isActive ? (
            <MailCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          ) : (
            <MailX className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
          )}
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Gmail connection</h3>
            <p className="text-xs text-slate-500 mt-1">
              {gmailStatus.isActive
                ? `Connected. Stored access expires at ${gmailStatus.expiresAtLabel}.`
                : profile?.gmailConnection
                ? `Expired at ${gmailStatus.expiresAtLabel}. Reconnect Gmail to search and sync inbox data.`
                : "Not connected. Connect Gmail to search and sync inbox data."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={gmailStatus.isActive ? onRevokeGmail : onConnectGmail}
          disabled={isSaving}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold border cursor-pointer ${
            gmailStatus.isActive
              ? "bg-white border-red-200 text-red-600 hover:bg-red-50"
              : "bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700"
          } disabled:opacity-60`}
        >
          {gmailStatus.isActive ? "Revoke Gmail" : "Connect Gmail"}
        </button>
      </div>

      <div className="border-t border-slate-100 pt-5 space-y-4">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Monthly consumption</h3>
            <p className="text-xs text-slate-500 mt-1">
              {totalLlmRequests} LLM request{totalLlmRequests === 1 ? "" : "s"} counted across Gemini workflows.
            </p>
          </div>
        </div>
        {consumeRows.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {consumeRows.slice(0, 6).map(([monthKey, consume]) => (
              <div key={monthKey} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {createConsumeMonthKey(`${monthKey}-01T00:00:00.000Z`)}
                </div>
                <div className="text-lg font-extrabold text-slate-900 mt-0.5">{consume.requestCount}</div>
                <div className="text-[10px] font-bold text-slate-400">{consume.totalTokenCount} tokens</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-semibold">No LLM consumption has been counted yet.</p>
        )}
      </div>
    </div>
  );
};
