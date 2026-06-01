import React, { useEffect, useState } from "react";
import { Play, Calendar, Globe, Table, Loader2, Plus, Tags, Trash2, Settings, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AddExtractorSubjectResponse, Extractor, ExtractionRecord, ExtractorOperationsPage } from "../../types";
import { ConfirmActionModal } from "../shared/ConfirmActionModal";
import { getPaginationPages } from "./getPaginationPages";

interface DashboardSlideProps {
  extractors: Extractor[];
  isLoading: boolean;
  viewMode?: "list" | "detail";
  selectedExtractorIdFromRoute?: string | null;
  onSelectExtractor?: (id: string) => void;
  onRunScan: (id: string, dateRange?: { after?: string; before?: string }) => Promise<void>;
  onToggleSchedule: (id: string, enabled: boolean) => Promise<void>;
  onUpdateWebhook: (id: string, url: string) => Promise<void>;
  onAddSubject: (id: string, subject: string) => Promise<AddExtractorSubjectResponse>;
  onLoadOperations: (id: string, page?: number) => Promise<ExtractorOperationsPage>;
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
  viewMode = "detail",
  selectedExtractorIdFromRoute,
  onSelectExtractor,
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
  const [operationPageByExtractorId, setOperationPageByExtractorId] = useState<Record<string, ExtractorOperationsPage>>({});
  const [loadingOperationsId, setLoadingOperationsId] = useState<string | null>(null);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Extractor | null>(null);

  useEffect(() => {
    if (extractors.length === 0) {
      setSelectedExtractorId(null);
      return;
    }

    if (!selectedExtractorId || !extractors.some((extractor) => extractor.id === selectedExtractorId)) {
      setSelectedExtractorId(extractors[0].id);
    }
  }, [extractors, selectedExtractorId]);

  useEffect(() => {
    if (selectedExtractorIdFromRoute && extractors.some((extractor) => extractor.id === selectedExtractorIdFromRoute)) {
      setSelectedExtractorId(selectedExtractorIdFromRoute);
    }
  }, [extractors, selectedExtractorIdFromRoute]);

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
      const page = await onLoadOperations(id, 1);
      setOperationRowsByExtractorId((prev) => ({ ...prev, [id]: page.operations }));
      setOperationPageByExtractorId((prev) => ({ ...prev, [id]: page }));

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
      const page = await onLoadOperations(id, 1);
      setOperationRowsByExtractorId((prev) => ({ ...prev, [id]: page.operations }));
      setOperationPageByExtractorId((prev) => ({ ...prev, [id]: page }));
      setNewSubjectValue("");
      setSubjectFeedback(result.message);
    } catch (err: any) {
      setSubjectFeedback(err.message || "Subject registration failed.");
    } finally {
      setIsSavingSubject(false);
    }
  };

  const handleConfirmDeleteExtractor = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    try {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.add(targetId);
        return next;
      });
      await onDeleteExtractor(targetId);
      setDeleteTarget(null);
      setIsSettingsPanelOpen(false);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  const selectedExtractor = extractors.find((e) => e.id === selectedExtractorId);
  const selectedOperationRows = selectedExtractor
    ? operationRowsByExtractorId[selectedExtractor.id] || selectedExtractor.extractions || []
    : [];
  const selectedOperationPage = selectedExtractor ? operationPageByExtractorId[selectedExtractor.id] : null;
  const selectedSyncDateFields = selectedExtractor
    ? [
        {
          label: "From",
          value: syncAfterByExtractorId[selectedExtractor.id] || "",
          update: (value: string) => setSyncAfterByExtractorId((prev) => ({ ...prev, [selectedExtractor.id]: value })),
        },
        {
          label: "To",
          value: syncBeforeByExtractorId[selectedExtractor.id] || "",
          update: (value: string) => setSyncBeforeByExtractorId((prev) => ({ ...prev, [selectedExtractor.id]: value })),
        },
      ]
    : [];

  useEffect(() => {
    if (!selectedExtractorId || operationRowsByExtractorId[selectedExtractorId]) return;

    let isMounted = true;
    setLoadingOperationsId(selectedExtractorId);
    onLoadOperations(selectedExtractorId)
      .then((page) => {
        if (!isMounted) return;
        setOperationRowsByExtractorId((prev) => ({ ...prev, [selectedExtractorId]: page.operations }));
        setOperationPageByExtractorId((prev) => ({ ...prev, [selectedExtractorId]: page }));
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

  const handleLoadOperationsPage = async (id: string, pageNumber: number) => {
    setLoadingOperationsId(id);
    try {
      const page = await onLoadOperations(id, pageNumber);
      setOperationRowsByExtractorId((prev) => ({ ...prev, [id]: page.operations }));
      setOperationPageByExtractorId((prev) => ({ ...prev, [id]: page }));
    } finally {
      setLoadingOperationsId(null);
    }
  };

  return (
    <div className="space-y-6" id="dashboard-workbench">
      {viewMode === "list" && (
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
      )}
      
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
        <div className={viewMode === "list" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "grid grid-cols-1"}>
          
          {/* List Bento Grid */}
          {viewMode === "list" && (
          <div className="space-y-4 md:contents">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
              Your Saved Extractors ({extractors.length})
            </h3>

            <div className="md:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {extractors.map((ext) => {
                const isSelected = ext.id === selectedExtractorId;
                const registeredSubjects = ext.subjects?.length ? ext.subjects : [{ id: `${ext.id}-legacy-query`, value: ext.query }];

                return (
                  <div
                    key={ext.id}
                    onClick={() => {
                      setSelectedExtractorId(ext.id);
                      onSelectExtractor?.(ext.id);
                    }}
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
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* dynamic Record Table View */}
          {viewMode === "detail" && (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {selectedExtractor && (
                <motion.div
                  key={selectedExtractor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                          {selectedExtractor.detectedType}
                        </span>
                        <h3 className="mt-1 text-xl font-extrabold text-slate-900">{selectedExtractor.name}</h3>
                        <p className="text-slate-500 text-[11px] mt-1">
                          {selectedExtractor.operationCount || selectedOperationRows.length} current extraction{(selectedExtractor.operationCount || selectedOperationRows.length) === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="flex flex-col items-stretch xl:items-end gap-2">
                        <div className="flex flex-wrap items-end gap-2">
                          {selectedSyncDateFields.map((field) => (
                            <label key={field.label} className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              {field.label}
                              <input
                                type="date"
                                value={field.value}
                                onChange={(e) => field.update(e.target.value)}
                                disabled={syncingIds.has(selectedExtractor.id)}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold normal-case tracking-normal text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </label>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleManualSync(selectedExtractor.id)}
                            disabled={syncingIds.has(selectedExtractor.id)}
                            className="h-9 px-4 rounded-lg bg-slate-900 border border-slate-950 hover:bg-black text-white font-bold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer select-none"
                          >
                            {syncingIds.has(selectedExtractor.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                            <span>Sync Box</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsSettingsPanelOpen(true)}
                            className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 inline-flex items-center justify-center cursor-pointer"
                            title="Extractor settings"
                            aria-label="Open extractor settings"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                        {syncFeedback[selectedExtractor.id] && (
                          <p className="text-[11px] font-bold text-indigo-700 xl:text-right">{syncFeedback[selectedExtractor.id]}</p>
                        )}
                      </div>
                    </div>

                    {loadingOperationsId === selectedExtractor.id && selectedOperationRows.length === 0 ? (
                      <div className="text-center py-10 font-medium text-slate-655 text-xs">
                        Loading parsed operations...
                      </div>
                    ) : selectedOperationRows.length === 0 ? (
                      <div className="text-center py-10 font-medium text-slate-655 text-xs">
                        No rows reside inside this extractor store yet. Press "Sync Box" to crawler.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-white rounded-2xl overflow-hidden">
                          <table className="w-full table-fixed text-left border-separate border-spacing-0">
                            <thead>
                              <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-450 text-slate-400 tracking-wider">
                                <th className="py-3 px-4 rounded-tl-2xl border-b border-slate-100">Subject</th>
                                <th className="py-3 px-4 border-b border-slate-100">From</th>
                                <th className="py-3 px-4 border-b border-slate-100">Date</th>
                                {selectedExtractor.schemaFields.map((field, index) => (
                                  <th
                                    key={field.fieldName}
                                    className={`py-3 px-4 text-indigo-700 font-mono border-b border-slate-100 ${
                                      index === selectedExtractor.schemaFields.length - 1 ? "rounded-tr-2xl" : ""
                                    }`}
                                  >
                                    {field.fieldName}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-55 divide-slate-100 text-xs text-slate-655">
                              {selectedOperationRows.map((rec) => (
                                <tr key={rec.id} className="hover:bg-slate-50/40 select-all">
                                  <td className="py-3 px-4 font-bold text-slate-800 break-words" title={rec.subject}>
                                    {rec.subject}
                                  </td>
                                  <td className="py-3 px-4 break-words" title={rec.from}>
                                    {rec.from.split("<")[0].trim() || rec.from}
                                  </td>
                                  <td className="py-3 px-4 text-[10px] text-slate-400 break-words">
                                    {rec.date.split(" ")[0]}
                                  </td>
                                  {selectedExtractor.schemaFields.map((field) => {
                                    const cellVal = rec.extractedData[field.fieldName];
                                    const displayVal = cellVal !== undefined && cellVal !== null
                                      ? (typeof cellVal === "object" ? JSON.stringify(cellVal) : String(cellVal))
                                      : "";

                                    return (
                                      <td key={field.fieldName} className="py-3 px-4 font-mono text-[11px] text-slate-700 select-text bg-indigo-50/10 break-words">
                                        {displayVal}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {selectedOperationPage && selectedOperationPage.totalPages > 1 && (
                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                            <p className="text-[11px] font-bold text-slate-500">
                              Page {selectedOperationPage.page} of {selectedOperationPage.totalPages} · {selectedOperationPage.totalCount} records
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleLoadOperationsPage(selectedExtractor.id, selectedOperationPage.page - 1)}
                                disabled={loadingOperationsId === selectedExtractor.id || selectedOperationPage.page <= 1}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                              >
                                Previous
                              </button>
                              {getPaginationPages(selectedOperationPage.page, selectedOperationPage.totalPages).map((pageNumber) => (
                                <button
                                  key={pageNumber}
                                  type="button"
                                  onClick={() => handleLoadOperationsPage(selectedExtractor.id, pageNumber)}
                                  disabled={loadingOperationsId === selectedExtractor.id || selectedOperationPage.page === pageNumber}
                                  className={`h-8 min-w-8 rounded-lg border px-2 text-[11px] font-bold disabled:opacity-100 ${
                                    selectedOperationPage.page === pageNumber
                                      ? "border-slate-950 bg-slate-900 text-white"
                                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  {pageNumber}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => handleLoadOperationsPage(selectedExtractor.id, selectedOperationPage.page + 1)}
                                disabled={loadingOperationsId === selectedExtractor.id || selectedOperationPage.page >= selectedOperationPage.totalPages}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {isSettingsPanelOpen && (
                      <>
                        <motion.button
                          type="button"
                          className="fixed inset-0 z-40 bg-slate-950/20 cursor-default"
                          aria-label="Close extractor settings"
                          onClick={() => setIsSettingsPanelOpen(false)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                        <motion.aside
                          className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl p-6 overflow-y-auto"
                          initial={{ x: "100%" }}
                          animate={{ x: 0 }}
                          exit={{ x: "100%" }}
                          transition={{ type: "spring", stiffness: 320, damping: 34 }}
                        >
                          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900">Extractor settings</h3>
                              <p className="text-[11px] font-semibold text-slate-500 mt-1 line-clamp-2">{selectedExtractor.name}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsSettingsPanelOpen(false)}
                              className="h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 inline-flex items-center justify-center cursor-pointer"
                              aria-label="Close extractor settings"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="mt-6 space-y-8">
                            <section className="space-y-4">
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                  <Tags className="w-4 h-4 text-indigo-500" /> Registered Subjects
                                </h4>
                                <p className="text-slate-500 text-xs leading-relaxed mt-1">
                                  These subject searches share this extractor schema and parsed dataset.
                                </p>
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
                            </section>

                            <section className="space-y-3 border-t border-slate-100 pt-6">
                              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-500" /> Extractor Controls
                              </h4>

                              <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 cursor-pointer">
                                <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  Schedule Run
                                </span>
                                <input
                                  type="checkbox"
                                  checked={selectedExtractor.enabledSchedule}
                                  onChange={(e) => onToggleSchedule(selectedExtractor.id, e.target.checked)}
                                  disabled={deletingIds.has(selectedExtractor.id)}
                                  className="w-4 h-4 border-slate-300 text-indigo-600 focus:ring-indigo-500 rounded shrink-0 cursor-pointer"
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() => setDeleteTarget(selectedExtractor)}
                                disabled={deletingIds.has(selectedExtractor.id)}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                              >
                                {deletingIds.has(selectedExtractor.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                <span>Delete extractor</span>
                              </button>
                            </section>

                            <section className="space-y-3 border-t border-slate-100 pt-6">
                              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-indigo-500" /> External Webhook Integrations
                              </h4>
                              <p className="text-slate-500 text-xs leading-relaxed">
                                Register an HTTP URL, and every new detected row dispatches a POST request instantly.
                              </p>

                              {editingWebhookId === selectedExtractor.id ? (
                                <form onSubmit={(e) => handleWebhookSubmit(e, selectedExtractor.id)} className="flex flex-col gap-2 mt-2">
                                  <input
                                    type="url"
                                    value={tempWebhookUrl}
                                    onChange={(e) => setTempWebhookUrl(e.target.value)}
                                    placeholder="https://api.myplatform.com/v1/webhooks/gmail"
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-105"
                                    required
                                  />
                                  <div className="flex gap-1">
                                    <button
                                      type="submit"
                                      disabled={isSavingWebhook}
                                      className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white rounded-xl px-4 py-2 cursor-pointer select-none"
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
                                <div className="flex flex-col gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2">
                                  <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Destination Hook Endpoint:</span>
                                    <p className="text-xs text-slate-655 font-mono break-all mt-0.5 select-text">
                                      {selectedExtractor.webhookUrl || "(No destination endpoint configured)"}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEditingWebhookId(selectedExtractor.id);
                                      setTempWebhookUrl(selectedExtractor.webhookUrl || "");
                                    }}
                                    className="py-1.5 px-4 font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all text-xs cursor-pointer select-none self-start"
                                  >
                                    Modify Destination
                                  </button>
                                </div>
                              )}
                            </section>
                          </div>
                        </motion.aside>
                      </>
                    )}
                  </AnimatePresence>
                  <ConfirmActionModal
                    isOpen={!!deleteTarget}
                    title="Delete extractor?"
                    description={`This will remove "${deleteTarget?.name || "this extractor"}" from your saved extractors.`}
                    confirmLabel="Delete extractor"
                    cancelLabel="Keep extractor"
                    tone="danger"
                    isWorking={!!deleteTarget && deletingIds.has(deleteTarget.id)}
                    onConfirm={handleConfirmDeleteExtractor}
                    onCancel={() => setDeleteTarget(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}

        </div>
      )}

    </div>
  );
};
