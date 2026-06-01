import React, { useState } from "react";
import { ArrowRight, Loader2, MailSearch, PlusCircle } from "lucide-react";
import { motion } from "motion/react";

interface CreateExtractorSlideProps {
  isStarting: boolean;
  onStart: (subject: string) => Promise<void>;
}

/**
 * Slide 2: New extractor creation intent.
 * Captures the first email subject matcher before the user reviews Gmail candidates.
 */
export const CreateExtractorSlide: React.FC<CreateExtractorSlideProps> = ({
  isStarting,
  onStart,
}) => {
  const [subject, setSubject] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextSubject = subject.trim();

    if (!nextSubject) {
      return;
    }

    await onStart(nextSubject);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="max-w-3xl mx-auto space-y-5"
      id="slide-create-extractor"
    >
      <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
        <div className="grid grid-cols-[48px_1fr] gap-4 items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 grid place-items-center">
            <MailSearch className="w-6 h-6" aria-hidden="true" />
          </div>
          <header>
            <h2 className="text-lg font-extrabold text-slate-900">Create New Extractor</h2>
            <div className="text-slate-500 text-xs leading-relaxed mt-1">
              Start with the subject text that identifies the emails you want to turn into structured rows.
            </div>
          </header>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="create-extractor-subject" className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              First subject matcher
            </label>
            <input
              id="create-extractor-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Stripe Invoice, Airbnb reservation, Shipping update"
              className="w-full text-slate-800 placeholder-slate-400 bg-slate-50 hover:bg-slate-50/70 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 rounded-xl py-3.5 px-4 text-sm transition-all shadow-inner"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isStarting || !subject.trim()}
            className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2 select-none cursor-pointer"
            id="start-extractor-creation"
          >
            {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            <span>Start Extraction</span>
            {!isStarting ? <ArrowRight className="w-4 h-4" /> : null}
          </button>
        </form>
      </div>

      <aside className="bg-slate-900 border border-slate-950 rounded-3xl p-5 shadow-sm text-white">
        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
          Extractor scope
        </div>
        <p className="text-sm leading-relaxed text-slate-200 mt-3">
          This subject becomes the first matcher for the extractor. The saved extractor keeps matchers as a subject list, so more can be added later without changing this creation flow.
        </p>
      </aside>
    </motion.section>
  );
};
