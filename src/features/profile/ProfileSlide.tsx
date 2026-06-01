import React, { useEffect, useState } from "react";
import { MailCheck, MailX, Save, UserRound } from "lucide-react";
import { UserProfile } from "../../types";
import { getGmailConnectionStatus } from "./getGmailConnectionStatus";

interface ProfileSlideProps {
  profile: UserProfile | null;
  isSaving: boolean;
  onUpdateProfile: (updates: { displayName: string; photoURL: string }) => Promise<void>;
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

  useEffect(() => {
    setDisplayName(profile?.displayName || "");
    setPhotoURL(profile?.photoURL || "");
  }, [profile]);

  const gmailStatus = getGmailConnectionStatus(profile);
  const profilePhotoURL = photoURL.trim();
  const profileTitle = displayName.trim() || profile?.email || "Profile";

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
                ? `Connected. Stored access expires on ${gmailStatus.expiresAtLabel}.`
                : profile?.gmailConnection
                ? `Expired on ${gmailStatus.expiresAtLabel}. Reconnect Gmail to search and sync inbox data.`
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
    </div>
  );
};
