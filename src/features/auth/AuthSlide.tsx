import React from "react";
import { Mail, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface AuthSlideProps {
  isLoggingIn: boolean;
  handleConnect: () => void;
}

/**
 * Slide 1: Welcome & Firebase Google Sign-In initiation.
 * Prompts user to authenticate and grant read-only Gmail access when needed.
 */
export const AuthSlide: React.FC<AuthSlideProps> = ({ isLoggingIn, handleConnect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm p-8 text-center mt-8"
      id="slide-auth"
    >
      <div className="mx-auto w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
        <Mail className="w-7 h-7" />
      </div>
      
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2 font-sans">
        Organizr
      </h2>
      
      <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto mb-8">
        Connect your account securely to search your inbox, examine repeating structures, and auto-propose refined databases with reliable extraction scripts.
      </p>

      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-500 mb-8 leading-relaxed text-left flex gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-slate-800 mb-0.5">Firebase Auth + Gmail Readonly</h4>
          This application signs in with Firebase Authentication and reuses your saved Gmail connection. It requests <strong>only read-only (gmail.readonly)</strong> permissions when Gmail needs to be connected.
        </div>
      </div>

      <button
        onClick={handleConnect}
        disabled={isLoggingIn}
        className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm select-none"
        id="gsi-login-button"
      >
        <div className="flex items-center gap-3">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block", width: "18px", height: "18px" }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
          <span>{isLoggingIn ? "Waiting for Firebase authorization..." : "Sign in with Google"}</span>
        </div>
      </button>
    </motion.div>
  );
};
