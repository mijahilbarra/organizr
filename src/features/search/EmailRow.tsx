import React from "react";
import { Copy, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { EmailMessage } from "../../types";

interface EmailRowProps {
  email: EmailMessage;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  copyToClipboard: (text: string) => void;
}

/**
 * Renders an interactive individual email card with selection inputs and expandable body content.
 */
export const EmailRow: React.FC<EmailRowProps> = ({
  email,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  copyToClipboard,
}) => {
  return (
    <div
      className={`group p-4 bg-slate-50 border rounded-2xl hover:border-indigo-300 transition-all ${
        isSelected ? "border-indigo-200 bg-indigo-50/5" : "border-slate-100"
      }`}
      id={`email-row-${email.id}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
            id={`email-checkbox-${email.id}`}
          />
          <div className="flex flex-col min-w-0 select-text" onClick={onToggleExpand}>
            <span className="text-sm font-bold text-slate-800 truncate cursor-pointer hover:text-indigo-600">
              {email.subject}
            </span>
            <span className="text-xs text-slate-500 truncate cursor-not-allowed">
              {email.date.split(" ")[0]} • {email.from.split("<")[0].trim() || email.from}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] font-mono text-slate-400 select-all hidden sm:block">
            ID: {email.id.substring(0, 8)}...
          </span>
          <button
            onClick={onToggleExpand}
            className="text-slate-450 hover:text-slate-655 p-1 rounded-lg self-center shrink-0 transition-colors cursor-pointer"
            id={`email-toggle-${email.id}`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-200 mt-3 pt-3 overflow-hidden text-xs text-slate-600"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                Full Message Body Payload
              </span>
              <button
                onClick={() => copyToClipboard(email.body)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5 cursor-pointer"
              >
                Copy Content <Copy className="w-2.5 h-2.5" />
              </button>
            </div>
            <pre className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-48 font-mono text-[10px] text-slate-700 select-text" style={{ scrollbarWidth: "thin" }}>
              {email.body || "No textual body content resides in this email."}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
