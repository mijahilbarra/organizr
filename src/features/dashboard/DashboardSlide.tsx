import React, { useState } from "react";
import { Play, Calendar, Globe, Table, SlidersHorizontal, Loader2, ArrowRightLeft, AlignLeft, Check, Copy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Extractor, ExtractionRecord } from "../../types";

interface DashboardSlideProps {
  extractors: Extractor[];
  isLoading: boolean;
  onRunScan: (id: string) => Promise<void>;
  onToggleSchedule: (id: string, enabled: boolean) => Promise<void>;
  onUpdateWebhook: (id: string, url: string) => Promise<void>;
}

/**
 * Slide 5: Comprehensive Extractor Management Platform.
 * Displays bento-grids of saved templates, dynamic database tables, crawler synchronizers,
 * and external webhook integration endpoints.
 */
export const DashboardSlide: React.FC<DashboardSlideProps> = ({
  extractors,
  isLoading,
  onRunScan,
  onToggleSchedule,
  onUpdateWebhook,
}) => {
  const [selectedExtractorId, setSelectedExtractorId] = useState<string | null>(
    extractors.length > 0 ? extractors[0].id : null
  );
  
  // Webhook updating states
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);
  const [tempWebhookUrl, setTempWebhookUrl] = useState("");
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);

  // Syncing states for specific rows
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncFeedback, setSyncFeedback] = useState<Record<string, string>>({});

  const handleManualSync = async (id: string) => {
    try {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setSyncFeedback((prev) => ({ ...prev, [id]: "" }));

      await onRunScan(id);

      setSyncFeedback((prev) => ({ ...prev, [id]: "Scan completed! Check updated records below." }));
    } catch (error: any) {
      setSyncFeedback((prev) => ({ ...prev, [id]: error.message || "Scan failed." }));
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleWebhookSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    try {
      setIsSavingWebhook(true);
      await onUpdateWebhook(id, tempWebhookUrl.trim());
      setEditingWebhookId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingWebhook(false);
    }
  };

  // If no initial selected id but extractors loaded, bind the first one
  if (extractors.length > 0 && !selectedExtractorId) {
    setSelectedExtractorId(extractors[0].id);
  }

  const selectedExtractor = extractors.find((e) => e.id === selectedExtractorId);

  return (
    <div className="space-y-6" id="dashboard-workbench">
      
      {extractors.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-16 bg-white border border-slate-200 rounded-3xl p-8" id="empty-dashboard">
          <Table className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Extractors Configured</h3>
          <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto">
            You don't have active parsing rules yet. Search and save a template first to unlock.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List Bento Grid */}
          <div className="space-y-4 lg:col-span-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
              Your Saved Extractors ({extractors.length})
            </h3>

            <div className="space-y-3">
              {extractors.map((ext) => {
                const isSelected = ext.id === selectedExtractorId;
                const isSyncing = syncingIds.has(ext.id);
                const feedback = syncFeedback[ext.id];

                return (
                  <div
                    key={ext.id}
                    onClick={() => setSelectedExtractorId(ext.id)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/5 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/20"
                    }`}
                    id={`extractor-card-${ext.id}`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="bg-indigo-150 text-indigo-700 font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                          {ext.detectedType}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ext.extractions.length} Records
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{ext.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Query: subject:"{ext.query}"</p>
                      </div>
                    </div>

                    {/* Meta controls & actions */}
                    <div className="border-t border-slate-100 mt-3 pt-3 flex flex-wrap gap-3 items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      {/* Scan trigger */}
                      <button
                        onClick={() => handleManualSync(ext.id)}
                        disabled={isSyncing}
                        className="py-1 px-3 rounded-lg bg-slate-900 border border-slate-950 hover:bg-black text-white font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer select-none"
                      >
                        {isSyncing ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                        <span>Sync Box</span>
                      </button>

                      {/* Schedule toggle checkbox */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-500 select-none">
                        <input
                          type="checkbox"
                          checked={ext.enabledSchedule}
                          onChange={(e) => onToggleSchedule(ext.id, e.target.checked)}
                          className="w-3.5 h-3.5 border-slate-300 text-indigo-600 focus:ring-indigo-500 rounded shrink-0 cursor-pointer"
                        />
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Schedule Run</span>
                      </label>
                    </div>

                    {feedback && (
                      <div className="mt-2 text-[10px] text-indigo-750 font-bold leading-relaxed">
                        {feedback}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* dynamic Record Table View */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {selectedExtractor && (
                <motion.div
                  key={selectedExtractor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Webhook integrator card */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-500" /> External Webhook Integration
                    </h3>
                    <p className="text-slate-555 text-xs leading-relaxed">
                      Transformations can automatically cascade to your apps. Register an HTTP URL, and every new detected row dispatches a POST request instantly.
                    </p>

                    {editingWebhookId === selectedExtractor.id ? (
                      <form onSubmit={(e) => handleWebhookSubmit(e, selectedExtractor.id)} className="flex flex-col sm:flex-row gap-2 mt-2">
                        <input
                          type="url"
                          value={tempWebhookUrl}
                          onChange={(e) => setTempWebhookUrl(e.target.value)}
                          placeholder="https://api.myplatform.com/v1/webhooks/gmail"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-105"
                          required
                        />
                        <div className="flex gap-1">
                          <button
                            type="submit"
                            disabled={isSavingWebhook}
                            className="bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 font-bold text-xs text-white rounded-xl px-4 py-2 cursor-pointer select-none"
                          >
                            {isSavingWebhook ? "Saving..." : "Save Endpoint"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingWebhookId(null)}
                            className="bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-500 rounded-xl px-3 py-2 cursor-pointer select-none"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-55/40 bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Destination Hook Endpoint:</span>
                          <p className="text-xs text-slate-655 font-mono truncate max-w-sm sm:max-w-md mt-0.5 select-text">
                            {selectedExtractor.webhookUrl || "(No destination endpoint configured)"}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingWebhookId(selectedExtractor.id);
                            setTempWebhookUrl(selectedExtractor.webhookUrl || "");
                          }}
                          className="py-1.5 px-4 font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all text-xs cursor-pointer select-none shrink-0 self-center"
                        >
                          Modify Destination
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Extraction log Database table card */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-150 border-slate-100 pb-3 gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                          <SlidersHorizontal className="w-4 h-4 text-slate-500" /> Parsed Dataset Table
                        </h4>
                        <p className="text-slate-500 text-[11px]">
                          Dynamic table showing current rows parsed from corresponding emails.
                        </p>
                      </div>
                    </div>

                    {selectedExtractor.extractions.length === 0 ? (
                      <div className="text-center py-10 font-medium text-slate-655 text-xs bg-slate-55/20 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        No rows reside inside this extractor store yet. Press "Sync Box" to crawler.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-100 rounded-2xl max-h-[450px]" style={{ scrollbarWidth: "thin" }}>
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-450 text-slate-400 tracking-wider">
                              <th className="py-3 px-4">Subject</th>
                              <th className="py-3 px-4">From</th>
                              <th className="py-3 px-4">Date</th>
                              {/* Dynamic payload schema headers */}
                              {selectedExtractor.schemaFields.map((field) => (
                                <th key={field.fieldName} className="py-3 px-4 text-indigo-700 font-mono">
                                  {field.fieldName}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-55 divide-slate-100 text-xs text-slate-655">
                            {selectedExtractor.extractions.map((rec) => (
                              <tr key={rec.id} className="hover:bg-slate-50/40 select-all">
                                <td className="py-3 px-4 font-bold text-slate-800 max-w-[180px] truncate" title={rec.subject}>
                                  {rec.subject}
                                </td>
                                <td className="py-3 px-4 max-w-[150px] truncate" title={rec.from}>
                                  {rec.from.split("<")[0].trim() || rec.from}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap text-[10px] text-slate-400">
                                  {rec.date.split(" ")[0]}
                                </td>
                                {/* Dynamic payload parsed cell values */}
                                {selectedExtractor.schemaFields.map((field) => {
                                  const cellVal = rec.extractedData[field.fieldName];
                                  const displayVal = cellVal !== undefined && cellVal !== null
                                    ? (typeof cellVal === "object" ? JSON.stringify(cellVal) : String(cellVal))
                                    : "";

                                  return (
                                    <td key={field.fieldName} className="py-3 px-4 font-mono text-[11px] text-slate-700 select-text bg-indigo-50/10">
                                      {displayVal}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

    </div>
  );
};
