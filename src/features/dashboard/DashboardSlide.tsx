import React, { useEffect, useState } from "react";
import { Play, Calendar, Globe, Table, SlidersHorizontal, Loader2, Plus, Tags, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AddExtractorSubjectResponse, Extractor, ExtractionRecord, ExtractorOperationsPage } from "../../types";

interface DashboardSlideProps {
  extractors: Extractor[];
  isLoading: boolean;
  onRunScan: (id: string, dateRange?: { after?: string; before?: string }) => Promise<void>;
  onToggleSchedule: (id: string, enabled: boolean) => Promise<void>;
  onUpdateWebhook: (id: string, url: string) => Promise<void>;
  onAddSubject: (id: string, subject: string) => Promise<AddExtractorSubjectResponse>;
  onLoadOperations: (id: string, cursor?: string | null) => Promise<ExtractorOperationsPage>;
  onDeleteExtractor: (id: string) => Promise<void>;
  onCreateExtractor: () => void;
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
  onAddSubject,
  onLoadOperations,
  onDeleteExtractor,
  onCreateExtractor,
}) => {
  const [selectedExtractorId, setSelectedExtractorId] = useState<string | null>(
    extractors.length > 0 ? extractors[0].id : null
  );
  
  // Webhook updating states
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);
  const [tempWebhookUrl, setTempWebhookUrl] = useState("");
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [newSubjectValue, setNewSubjectValue] = useState("");
  const [isSavingSubject, setIsSavingSubject] = useState(false);
  const [subjectFeedback, setSubjectFeedback] = useState("");

  // Syncing states for specific rows
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncFeedback, setSyncFeedback] = useState<Record<string, string>>({});
  const [syncAfterByExtractorId, setSyncAfterByExtractorId] = useState<Record<string, string>>({});
  const [syncBeforeByExtractorId, setSyncBeforeByExtractorId] = useState<Record<string, string>>({});
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [operationRowsByExtractorId, setOperationRowsByExtractorId] = useState<Record<string, ExtractionRecord[]>>({});
  const [operationCursorByExtractorId, setOperationCursorByExtractorId] = useState<Record<string, string | null>>({});
  const [loadingOperationsId, setLoadingOperationsId] = useState<string | null>(null);

  useEffect(() => {
    if (extractors.length === 0) {
      setSelectedExtractorId(null);
      return;
    }

    if (!selectedExtractorId || !extractors.some((extractor) => extractor.id === selectedExtractorId)) {
      setSelectedExtractorId(extractors[0].id);
    }
  }, [extractors, selectedExtractorId]);

  const handleManualSync = async (id: string) => {
    const after = syncAfterByExtractorId[id] || undefined;
    const before = syncBeforeByExtractorId[id] || undefined;

    try {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setSyncFeedback((prev) => ({ ...prev, [id]: "" }));

      await onRunScan(id, { after, before });
      const page = await onLoadOperations(id);
      setOperationRowsByExtractorId((prev) => ({ ...prev, [id]: page.operations }));
      setOperationCursorByExtractorId((prev) => ({ ...prev, [id]: page.nextCursor }));

      const rangeLabel = after || before ? " for the selected dates" : "";
      setSyncFeedback((prev) => ({ ...prev, [id]: `Scan completed${rangeLabel}. Check updated records below.` }));
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

  const handleSubjectSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const subject = newSubjectValue.trim();
    if (!subject) return;

    try {
      setIsSavingSubject(true);
      setSubjectFeedback("Searching Gmail, running Gemini, and extracting with the current schema...");
      const result = await onAddSubject(id, subject);
      const page = await onLoadOperations(id);
      setOperationRowsByExtractorId((prev) => ({ ...prev, [id]: page.operations }));
      setOperationCursorByExtractorId((prev) => ({ ...prev, [id]: page.nextCursor }));
      setNewSubjectValue("");
      setSubjectFeedback(result.message);
    } catch (err: any) {
      setSubjectFeedback(err.message || "Subject registration failed.");
    } finally {
      setIsSavingSubject(false);
    }
  };

  const handleDeleteExtractor = async (id: string, name: string) => {
    const shouldDelete = window.confirm(`Delete extractor "${name}"? This will remove its schema, subjects, and parsed records.`);

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      await onDeleteExtractor(id);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const selectedExtractor = extractors.find((e) => e.id === selectedExtractorId);
  const selectedOperationRows = selectedExtractor
    ? operationRowsByExtractorId[selectedExtractor.id] || selectedExtractor.extractions || []
    : [];
  const selectedOperationCursor = selectedExtractor ? operationCursorByExtractorId[selectedExtractor.id] : null;

  useEffect(() => {
    if (!selectedExtractorId || operationRowsByExtractorId[selectedExtractorId]) return;

    let isMounted = true;
    setLoadingOperationsId(selectedExtractorId);
    onLoadOperations(selectedExtractorId)
      .then((page) => {
        if (!isMounted) return;
        setOperationRowsByExtractorId((prev) => ({ ...prev, [selectedExtractorId]: page.operations }));
        setOperationCursorByExtractorId((prev) => ({ ...prev, [selectedExtractorId]: page.nextCursor }));
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        if (isMounted) {
          setLoadingOperationsId(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedExtractorId, operationRowsByExtractorId, onLoadOperations]);

  const handleLoadMoreOperations = async (id: string) => {
    const cursor = operationCursorByExtractorId[id];
    if (!cursor) return;

    setLoadingOperationsId(id);
    try {
      const page = await onLoadOperations(id, cursor);
      setOperationRowsByExtractorId((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), ...page.operations],
      }));
      setOperationCursorByExtractorId((prev) => ({ ...prev, [id]: page.nextCursor }));
    } finally {
      setLoadingOperationsId(null);
    }
  };

  return (
    <div className="space-y-6" id="dashboard-workbench">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Extraction Dashboard</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            {isLoading ? "Loading saved extractors..." : `${extractors.length} saved extractors available.`}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateExtractor}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 border border-indigo-700 text-white font-bold text-xs rounded-xl px-4 py-2.5 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Extractor</span>
        </button>
      </div>
      
      {extractors.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-16 bg-white border border-slate-200 rounded-2xl p-8" id="empty-dashboard">
          <Table className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Extractors Configured</h3>
          <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto">
            You don't have active parsing rules yet. Create a template from Gmail search results.
          </p>
          <button
            type="button"
            onClick={onCreateExtractor}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black border border-slate-950 text-white font-bold text-xs rounded-xl px-4 py-2.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create extractor</span>
          </button>
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
                const isDeleting = deletingIds.has(ext.id);
                const feedback = syncFeedback[ext.id];
                const registeredSubjects = ext.subjects?.length ? ext.subjects : [{ id: `${ext.id}-legacy-query`, value: ext.query }];

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
                          {ext.operationCount || ext.extractions.length} Records
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{ext.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {registeredSubjects.length} subject{registeredSubjects.length === 1 ? "" : "s"} registered
                        </p>
                      </div>
                    </div>

                    {/* Meta controls & actions */}
                    <div className="border-t border-slate-100 mt-3 pt-3 flex flex-wrap gap-3 items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      {/* Scan trigger */}
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          From
                          <input
                            type="date"
                            value={syncAfterByExtractorId[ext.id] || ""}
                            onChange={(e) => setSyncAfterByExtractorId((prev) => ({ ...prev, [ext.id]: e.target.value }))}
                            disabled={isSyncing || isDeleting}
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold normal-case tracking-normal text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          To
                          <input
                            type="date"
                            value={syncBeforeByExtractorId[ext.id] || ""}
                            onChange={(e) => setSyncBeforeByExtractorId((prev) => ({ ...prev, [ext.id]: e.target.value }))}
                            disabled={isSyncing || isDeleting}
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold normal-case tracking-normal text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </label>
                        <button
                          onClick={() => handleManualSync(ext.id)}
                          disabled={isSyncing || isDeleting}
                          className="h-8 px-3 rounded-lg bg-slate-900 border border-slate-950 hover:bg-black text-white font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer select-none"
                        >
                          {isSyncing ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                          <span>Sync Box</span>
                        </button>
                      </div>

                      {/* Schedule toggle checkbox */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-500 select-none">
                        <input
                          type="checkbox"
                          checked={ext.enabledSchedule}
                          onChange={(e) => onToggleSchedule(ext.id, e.target.checked)}
                          disabled={isDeleting}
                          className="w-3.5 h-3.5 border-slate-300 text-indigo-600 focus:ring-indigo-500 rounded shrink-0 cursor-pointer"
                        />
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Schedule Run</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleDeleteExtractor(ext.id, ext.name)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all cursor-pointer select-none"
                        title="Delete extractor"
                        aria-label={`Delete extractor ${ext.name}`}
                      >
                        {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </button>
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
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                          <Tags className="w-4 h-4 text-indigo-500" /> Registered Subjects
                        </h3>
                        <p className="text-slate-555 text-xs leading-relaxed mt-1">
                          These subject searches share this extractor schema and parsed dataset.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(selectedExtractor.subjects?.length
                        ? selectedExtractor.subjects
                        : [{ id: `${selectedExtractor.id}-legacy-query`, value: selectedExtractor.query }]
                      ).map((subject) => (
                        <span
                          key={subject.id}
                          className="inline-flex max-w-full items-center rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700"
                          title={subject.value}
                        >
                          <span className="truncate">subject:"{subject.value}"</span>
                        </span>
                      ))}
                    </div>

                    <form onSubmit={(e) => handleSubjectSubmit(e, selectedExtractor.id)} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newSubjectValue}
                        onChange={(e) => setNewSubjectValue(e.target.value)}
                        placeholder="Add subject and extract matching emails"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-105"
                      />
                      <button
                        type="submit"
                        disabled={isSavingSubject || !newSubjectValue.trim()}
                        className="bg-slate-900 border border-slate-950 hover:bg-black disabled:opacity-50 font-bold text-xs text-white rounded-xl px-4 py-2 cursor-pointer select-none inline-flex items-center justify-center gap-1.5"
                      >
                        {isSavingSubject ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        <span>{isSavingSubject ? "Extracting" : "Add & Extract"}</span>
                      </button>
                    </form>

                    {subjectFeedback && (
                      <p className="text-[11px] font-bold text-slate-500">{subjectFeedback}</p>
                    )}
                  </div>

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

                    {loadingOperationsId === selectedExtractor.id && selectedOperationRows.length === 0 ? (
                      <div className="text-center py-10 font-medium text-slate-655 text-xs bg-slate-55/20 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        Loading parsed operations...
                      </div>
                    ) : selectedOperationRows.length === 0 ? (
                      <div className="text-center py-10 font-medium text-slate-655 text-xs bg-slate-55/20 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        No rows reside inside this extractor store yet. Press "Sync Box" to crawler.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="overflow-x-auto border border-slate-100 rounded-2xl max-h-[450px]" style={{ scrollbarWidth: "thin" }}>
                          <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-450 text-slate-400 tracking-wider">
                                <th className="py-3 px-4">Subject</th>
                                <th className="py-3 px-4">From</th>
                                <th className="py-3 px-4">Date</th>
                                {selectedExtractor.schemaFields.map((field) => (
                                  <th key={field.fieldName} className="py-3 px-4 text-indigo-700 font-mono">
                                    {field.fieldName}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-55 divide-slate-100 text-xs text-slate-655">
                              {selectedOperationRows.map((rec) => (
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
                        {selectedOperationCursor && (
                          <button
                            type="button"
                            onClick={() => handleLoadMoreOperations(selectedExtractor.id)}
                            disabled={loadingOperationsId === selectedExtractor.id}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                          >
                            {loadingOperationsId === selectedExtractor.id && <Loader2 className="w-3 h-3 animate-spin" />}
                            <span>Load 20 more</span>
                          </button>
                        )}
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
