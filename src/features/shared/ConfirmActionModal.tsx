import React from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isWorking?: boolean;
  tone?: "danger" | "neutral";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  isWorking = false,
  tone = "neutral",
  onConfirm,
  onCancel,
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/30 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-action-title"
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-xl border p-2 ${
                tone === "danger"
                  ? "border-red-100 bg-red-50 text-red-600"
                  : "border-slate-100 bg-slate-50 text-slate-600"
              }`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 id="confirm-action-title" className="text-sm font-extrabold text-slate-900">{title}</h3>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">{description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={isWorking}
              className="h-8 w-8 shrink-0 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-60"
              aria-label="Close confirmation"
            >
              <X className="mx-auto h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isWorking}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isWorking}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold text-white disabled:opacity-60 ${
                tone === "danger"
                  ? "border-red-700 bg-red-600 hover:bg-red-700"
                  : "border-slate-950 bg-slate-900 hover:bg-black"
              }`}
            >
              {isWorking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
