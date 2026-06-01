import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, MailCheck, MailX, Settings, UserRound } from "lucide-react";
import { UserProfile } from "../../types";
import { getGmailConnectionStatus } from "./getGmailConnectionStatus";

interface UserAccountMenuProps {
  profile: UserProfile | null;
  isSaving: boolean;
  onOpenProfile: () => void;
  onConnectGmail: () => Promise<void>;
  onRevokeGmail: () => Promise<void>;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  profile,
  isSaving,
  onOpenProfile,
  onConnectGmail,
  onRevokeGmail,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const gmailStatus = getGmailConnectionStatus(profile);
  const profilePhotoURL = profile?.photoURL?.trim();
  const profileTitle = profile?.displayName?.trim() || profile?.email || "Perfil de usuario";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeMenuFromOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const closeMenuFromEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenuFromOutside);
    document.addEventListener("keydown", closeMenuFromEscape);

    return () => {
      document.removeEventListener("mousedown", closeMenuFromOutside);
      document.removeEventListener("keydown", closeMenuFromEscape);
    };
  }, [isOpen]);

  const handleOpenProfile = () => {
    onOpenProfile();
    setIsOpen(false);
  };

  const handleGmailPreference = async () => {
    if (gmailStatus.isActive) {
      await onRevokeGmail();
    } else {
      await onConnectGmail();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`w-10 h-10 border rounded-xl transition-all cursor-pointer flex items-center justify-center overflow-hidden ${
          "border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50"
        }`}
        title={profileTitle}
        id="action-profile-menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {profilePhotoURL ? (
          <img
            src={profilePhotoURL}
            alt={profileTitle}
            className="w-full h-full object-cover rounded-[10px]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <UserRound className="w-4 h-4" />
        )}
        <ChevronDown className="absolute -right-1 -bottom-1 w-4 h-4 bg-white border border-slate-200 rounded-full p-0.5 text-slate-500" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-12 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50"
          role="menu"
          aria-label="Menu de usuario"
        >
          <div className="px-2 pb-3 mb-3 border-b border-slate-100">
            <p className="text-sm font-extrabold text-slate-900 truncate">{profileTitle}</p>
            <p className="text-xs font-semibold text-slate-500 truncate">{profile?.email || "Usuario autenticado"}</p>
          </div>

          <button
            type="button"
            onClick={handleOpenProfile}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 cursor-pointer text-left"
            role="menuitem"
          >
            <UserRound className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="flex-1">
              <span className="block text-sm font-bold text-slate-800">Perfil</span>
              <span className="block text-xs font-semibold text-slate-500">Editar nombre y avatar</span>
            </span>
          </button>

          <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-slate-500" />
              <span className="text-xs uppercase font-extrabold text-slate-500">Preferencias</span>
            </div>
            <div className="flex items-start gap-2">
              {gmailStatus.isActive ? (
                <MailCheck className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <MailX className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">Gmail</p>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  {gmailStatus.isActive
                    ? `Conectado hasta ${gmailStatus.expiresAtLabel}.`
                    : "Conecta Gmail para buscar correos."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGmailPreference}
              disabled={isSaving}
              className={`mt-3 w-full inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-bold border cursor-pointer ${
                gmailStatus.isActive
                  ? "bg-white border-red-200 text-red-600 hover:bg-red-50"
                  : "bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700"
              } disabled:opacity-60`}
            >
              {isSaving
                ? "Guardando..."
                : gmailStatus.isActive
                ? "Desconectar Gmail"
                : "Conectar Gmail"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
