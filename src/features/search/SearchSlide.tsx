import React from "react";
import { Search, Loader2, Library, Sparkles, ScrollText } from "lucide-react";
import { motion } from "motion/react";
import { EmailMessage } from "../../types";
import { EmailRow } from "./EmailRow";

interface SearchSlideProps {
  subjectInput: string;
  setSubjectInput: (val: string) => void;
  isSearching: boolean;
  emails: EmailMessage[];
  handleSearch: (e: React.FormEvent) => void;
  selectedIds: Set<string>;
  toggleSelectAll: () => void;
  toggleSelect: (id: string) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  copyToClipboard: (text: string) => void;
  handleAnalyze: () => void;
  isAnalyzing: boolean;
  analysisLogs: string[];
}

const SUGGESTIONS = [
  "Invoice",
  "GitHub",
  "Your subscription",
  "Booking",
  "Alerta",
  "Welcome"
];

/**
 * Slide 2: Template Inbox Crawler and Scoping.
 * Allows searching by matching email themes, viewing candidates, and choosing target example cases.
 */
export const SearchSlide: React.FC<SearchSlideProps> = ({
  subjectInput,
  setSubjectInput,
  isSearching,
  emails,
  handleSearch,
  selectedIds,
  toggleSelectAll,
  toggleSelect,
  expandedIds,
  toggleExpand,
  copyToClipboard,
  handleAnalyze,
  isAnalyzing,
  analysisLogs,
}) => {
  const allSelected = emails.length > 0 && selectedIds.size === emails.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="max-w-4xl mx-auto space-y-6"
      id="slide-search"
    >
      {/* Search Input Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Library className="w-5 h-5 text-indigo-500" /> Search Candidate Emails
        </h3>
        <p className="text-slate-500 text-xs mb-5">
          Type an email subject keyword or pattern to find real templates from your Gmail inbox.
        </p>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                placeholder="Enter subject theme, e.g. 'Stripe Invoice' or 'Airbnb reservation'..."
                className="w-full text-slate-800 placeholder-slate-400 bg-slate-50 hover:bg-slate-50/70 focus:bg-white border border-slate-250 hover:border-slate-350 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 rounded-xl py-3.5 pl-11 pr-4 text-sm transition-all shadow-inner"
                id="search-subject-input"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !subjectInput.trim()}
              className="py-3.5 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2 select-none cursor-pointer"
              id="search-emails-button"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Find Emails</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Common concepts:</span>
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setSubjectInput(sug)}
                className="text-xs px-3 py-1 rounded-full border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/20 text-slate-600 hover:text-indigo-600 transition-all select-none cursor-pointer"
                id={`suggestion-${sug.replace(/\s+/g, "-").toLowerCase()}`}
              >
                Subject: "{sug}"
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Results Checklist Card */}
      {emails.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-slate-800">
                Discovered Emails ({emails.length})
              </h4>
              <span className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold py-0.5 px-2.5 rounded-full">
                {selectedIds.size} Selected
              </span>
            </div>
            <button
              onClick={toggleSelectAll}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              id="toggle-select-all"
            >
              {allSelected ? "Clear Selection" : "Select All"}
            </button>
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {emails.map((mail) => (
              <EmailRow
                key={mail.id}
                email={mail}
                isSelected={selectedIds.has(mail.id)}
                isExpanded={expandedIds.has(mail.id)}
                onToggleSelect={() => toggleSelect(mail.id)}
                onToggleExpand={() => toggleExpand(mail.id)}
                copyToClipboard={copyToClipboard}
              />
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleAnalyze}
              disabled={selectedIds.size === 0 || isAnalyzing}
              className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm tracking-wide disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 select-none cursor-pointer"
              id="analyze-propose-schema"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gemini is thinking... (5-10s)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Extract Fields Schema</span>
                </>
              )}
            </button>
          </div>

          {(isAnalyzing || analysisLogs.length > 0) && (
            <div className="border border-slate-200 bg-slate-950 rounded-2xl p-4 text-slate-100 space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-indigo-200">
                <ScrollText className="w-3.5 h-3.5" />
                <span>Gemini Refinement Log</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px] leading-relaxed max-h-44 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                {analysisLogs.map((log, index) => (
                  <div key={`${index}-${log}`} className="text-slate-300">
                    {log}
                  </div>
                ))}
                {isAnalyzing && (
                  <div className="text-indigo-200 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>[Gemini Schema] Awaiting next refinement event...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
