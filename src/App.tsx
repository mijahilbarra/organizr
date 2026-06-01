import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Key, Sparkles, SlidersHorizontal, AlertCircle, RefreshCw, Cpu, LogOut, CheckCircle2, Bug } from "lucide-react";
import { EmailMessage, AnalysisResponse, SchemaField, Extractor } from "./types";
import { createBackendHeadersForSession } from "./firebase/createBackendHeadersForSession";
import type { FirebaseAuthSession } from "./firebase/FirebaseAuthSession";
import { hasFirebaseConfig } from "./firebase/hasFirebaseConfig";
import { signInWithGoogle } from "./firebase/signInWithGoogle";
import { signOutFirebaseUser } from "./firebase/signOutFirebaseUser";
import { subscribeToFirebaseUser } from "./firebase/subscribeToFirebaseUser";

// Import modular feature slide components (each function/component in its own file)
import { AuthSlide } from "./features/auth/AuthSlide";
import { SearchSlide } from "./features/search/SearchSlide";
import { toggleStringSetValue } from "./features/search/toggleStringSetValue";
import { SchemaSlide } from "./features/schema/SchemaSlide";
import { ScriptSlide } from "./features/script/ScriptSlide";
import { DashboardSlide } from "./features/dashboard/DashboardSlide";
import { TicketsSlide } from "./features/tickets/TicketsSlide";

export default function App() {
  // Global states
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Firebase authentication states
  const [firebaseSession, setFirebaseSession] = useState<FirebaseAuthSession | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Wizard flow navigation
  const [currentSlide, setCurrentSlide] = useState<"auth" | "search" | "schema" | "script" | "dashboard" | "tickets">("auth");

  // Crawling States
  const [subjectInput, setSubjectInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [expandedEmailIds, setExpandedEmailIds] = useState<Set<string>>(new Set());

  // Analyzing States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [scriptCode, setScriptCode] = useState("");

  // Extractor Management States
  const [extractors, setExtractors] = useState<Extractor[]>([]);
  const [loadingExtractors, setLoadingExtractors] = useState(false);
  const [isSavingExtractor, setIsSavingExtractor] = useState(false);

  // 1. Fetch backend capabilities and secrets status
  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      setErrorText(null);
      const res = await fetch("/api/config");
      
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Bootstrap failed: Server returned non-JSON structure. ${text.substring(0, 200)}`);
      }

      if (!res.ok) {
        throw new Error("Could not contact backend API context.");
      }

      await res.json();
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Failed to contact setup backend.");
    } finally {
      setLoadingConfig(false);
    }
  };

  // 2. Fetch all saved extractors from the JSON repository
  const fetchExtractors = async (activeSession: FirebaseAuthSession) => {
    try {
      setLoadingExtractors(true);
      const res = await fetch("/api/extractors", {
        headers: createBackendHeadersForSession(activeSession),
      });

      if (!res.ok) {
        throw new Error("Failed to load saved templates.");
      }

      const data = await res.json();
      setExtractors(data.extractors || []);
    } catch (err: any) {
      console.error("Dashboard list synchronizer exception:", err);
    } finally {
      setLoadingExtractors(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      return;
    }

    return subscribeToFirebaseUser((session) => {
      setFirebaseSession((currentSession) => {
        if (!session) {
          return null;
        }

        return {
          ...session,
          gmailAccessToken: currentSession?.gmailAccessToken || session.gmailAccessToken,
        };
      });
      setIsLoggingIn(false);
    });
  }, []);

  // Sync extractors whenever Firebase session attaches
  useEffect(() => {
    if (firebaseSession) {
      fetchExtractors(firebaseSession);
      // Auto transition to searching templates
      if (currentSlide === "auth") {
        setCurrentSlide("search");
      }
    } else {
      setCurrentSlide("auth");
      setExtractors([]);
    }
  }, [firebaseSession]);

  // Launch Firebase Google sign in popup
  const handleConnect = async () => {
    setIsLoggingIn(true);
    setErrorText(null);
    try {
      const session = await signInWithGoogle();
      setFirebaseSession(session);
    } catch (err: any) {
      setErrorText(err.message || "Failed to sign in with Firebase Google provider.");
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutFirebaseUser();
    } catch (err) {
      console.error("Firebase sign out failed:", err);
    }

    setFirebaseSession(null);
    setEmails([]);
    setSelectedEmailIds(new Set());
    setExpandedEmailIds(new Set());
    setAnalysisResult(null);
    setSchemaFields([]);
    setScriptCode("");
    setCurrentSlide("auth");
  };

  // Gmail Lookup Crawling logic
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectInput.trim()) return;

    try {
      setIsSearching(true);
      setErrorText(null);
      setAnalysisResult(null);
      setSelectedEmailIds(new Set());
      setExpandedEmailIds(new Set());

      const res = await fetch(`/api/emails?subject=${encodeURIComponent(subjectInput.trim())}`, {
        headers: createBackendHeadersForSession(firebaseSession),
      });

      // Avoid crashing with opaque unexpected token errors:
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const textStr = await res.text();
        throw new Error(`Backend Exception: Expected JSON representation but received raw page body. Details: ${textStr.substring(0, 400)}`);
      }

      if (!res.ok) {
        if (res.status === 401) {
          await handleLogout();
          throw new Error("Your Firebase session has expired. Please authenticate with Google again.");
        }
        const errData = await res.json();
        throw new Error(errData.error || "Failed to retrieve matching Gmail messages.");
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      const results = data.emails || [];
      setEmails(results);
      
      // Auto-select all matching emails by default
      if (results.length > 0) {
        setSelectedEmailIds(new Set(results.map((m: EmailMessage) => m.id)));
      }
    } catch (err: any) {
      setErrorText(err.message || "Something went wrong searching emails.");
    } finally {
      setIsSearching(false);
    }
  };

  // Gemini Analytical Schema propose logic
  const handleAnalyze = async () => {
    if (selectedEmailIds.size === 0) return;

    try {
      setIsAnalyzing(true);
      setErrorText(null);
      setAnalysisResult(null);

      const targetEmails = emails.filter((mail) => selectedEmailIds.has(mail.id));

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: createBackendHeadersForSession(firebaseSession, true),
        body: JSON.stringify({ emails: targetEmails }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const textStr = await res.text();
        throw new Error(`Backend Analytical failure: Gmail extractor context returned un-parsable layouts. Details: ${textStr.substring(0, 400)}`);
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gemini model schema deduction failed.");
      }

      const data: AnalysisResponse = await res.json();
      setAnalysisResult(data);
      setSchemaFields(data.schemaFields || []);
      setScriptCode(data.scriptCode || "");
      setCurrentSlide("schema");
    } catch (err: any) {
      setErrorText(err.message || "Analytical engine crashed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Extractor Saving endpoint
  const handleSaveExtractor = async (name: string) => {
    if (!analysisResult) return;
    try {
      setIsSavingExtractor(true);
      setErrorText(null);

      const payload = {
        name,
        query: subjectInput,
        detectedType: analysisResult.detectedType,
        explanation: analysisResult.explanation,
        scriptCode,
        aiScriptCode: analysisResult.aiScriptCode,
        schemaFields,
        enabledSchedule: false,
        initialEmails: emails.filter((m) => selectedEmailIds.has(m.id)),
        initialResults: analysisResult.sampleExtractedResults,
      };

      const res = await fetch("/api/extractors", {
        method: "POST",
        headers: createBackendHeadersForSession(firebaseSession, true),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || "Failed to commit extractor template.");
      }

      const newExtractor = await res.json();
      
      // Update local state smoothly
      setExtractors((prev) => [newExtractor, ...prev]);
      setCurrentSlide("dashboard");
    } catch (err: any) {
      setErrorText(err.message || "Failed to persist extractor.");
    } finally {
      setIsSavingExtractor(false);
    }
  };

  // Extractor Crawler sync/scanning trigger
  const handleRunScan = async (id: string) => {
    try {
      const res = await fetch(`/api/extractors/${id}/run`, {
        method: "POST",
        headers: createBackendHeadersForSession(firebaseSession),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Execution failed scanning Gmail box.");
      }

      const result = await res.json();
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Replace list reference to propagate updates
      setExtractors((prev) =>
        prev.map((e) => (e.id === id ? result.extractor : e))
      );
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  };

  // Toggle Extractor Schedule state
  const handleToggleSchedule = async (id: string, enabled: boolean) => {
    try {
      // Optimitic update
      setExtractors((prev) =>
        prev.map((e) => (e.id === id ? { ...e, enabledSchedule: enabled } : e))
      );

      const res = await fetch(`/api/extractors/${id}/schedule`, {
        method: "POST",
        headers: createBackendHeadersForSession(firebaseSession, true),
        body: JSON.stringify({ enabledSchedule: enabled }),
      });

      if (!res.ok) {
        // Rollback state on error
        setExtractors((prev) =>
          prev.map((e) => (e.id === id ? { ...e, enabledSchedule: !enabled } : e))
        );
        const errObj = await res.json();
        throw new Error(errObj.error || "Failed to switch schedule boolean.");
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Configure Webhook URL configurations
  const handleUpdateWebhook = async (id: string, webhookUrl: string) => {
    try {
      const res = await fetch(`/api/extractors/${id}/webhook`, {
        method: "POST",
        headers: createBackendHeadersForSession(firebaseSession, true),
        body: JSON.stringify({ webhookUrl }),
      });

      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || "Failed to configure webhook destination.");
      }

      const updated = await res.json();
      setExtractors((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Helpers to adjust Selection Sets
  const toggleSelect = (id: string) => {
    setSelectedEmailIds((prev) => toggleStringSetValue(prev, id));
  };

  const toggleSelectAll = () => {
    if (selectedEmailIds.size === emails.length) {
      setSelectedEmailIds(new Set());
    } else {
      setSelectedEmailIds(new Set(emails.map((m) => m.id)));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedEmailIds((prev) => toggleStringSetValue(prev, id));
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-12 h-12 border-2 border-slate-200 border-t-indigo-600 rounded-full mb-4"
        />
        <p className="text-slate-600 text-sm font-semibold selection:bg-none">Bootstrapping analysis systems...</p>
      </div>
    );
  }

  const isFirebaseAuthConfigured = hasFirebaseConfig();

  // Flow wizard steps definitions
  const stepsList = [
    { id: "auth", num: 1, label: "Authorize" },
    { id: "search", num: 2, label: "Scan Box" },
    { id: "schema", num: 3, label: "Audit Variables" },
    { id: "script", num: 4, label: "Test Sandbox" },
    { id: "dashboard", num: 5, label: "Stored Tables" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900 pb-16">
      
      {/* Dynamic Navigation Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm">
              G
            </div>
            <div>
              <h1 className="font-extrabold text-slate-800 tracking-tight text-base sm:text-lg flex items-center gap-1.5">
                Gmail Schema Extractor
                <span className="text-[10px] bg-slate-100 text-slate-550 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  v1.2.0
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {firebaseSession ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentSlide("dashboard")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    currentSlide === "dashboard"
                      ? "bg-slate-900 border-slate-950 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-655 hover:bg-slate-50"
                  }`}
                >
                  Extraction Dashboard ({extractors.length})
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                  title="Switch Auth Account"
                  id="action-log-out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 border border-slate-200/60 rounded-full select-none text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Cpu className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                <span>System Ready</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide Navigation step bar (Visible when Firebase Auth client config exists) */}
      {isFirebaseAuthConfigured && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs select-none">
            {stepsList.map((step) => {
              const isActive = currentSlide === step.id;
              const isPassed = stepsList.findIndex((s) => s.id === currentSlide) > stepsList.findIndex((s) => s.id === step.id);
              const isLocked = !firebaseSession && step.id !== "auth";
              const isSchemaLocked = !analysisResult && (step.id === "schema" || step.id === "script");

              return (
                <button
                  key={step.id}
                  disabled={isLocked || isSchemaLocked}
                  onClick={() => setCurrentSlide(step.id as any)}
                  className={`flex flex-col sm:flex-row items-center gap-2 px-3 py-2 rounded-xl transition-all font-bold text-xs ${
                    isActive
                      ? "text-indigo-600 bg-indigo-50/20"
                      : isPassed
                      ? "text-green-600"
                      : "text-slate-400 hover:text-slate-600"
                  } disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer`}
                >
                  <div className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] border ${
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : isPassed
                      ? "bg-green-50 border-green-200 text-green-600"
                      : "border-slate-300 text-slate-400"
                  }`}>
                    {isPassed ? "✓" : step.num}
                  </div>
                  <span className="hidden sm:inline font-mono uppercase tracking-tight">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Container Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Render detailed error notices */}
        {errorText && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-3xl p-5 flex gap-4 text-red-800 shadow-xs" id="notice-error-fallback">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-extrabold text-sm text-red-900 mb-1">Scraper Execution Exception</h5>
              <div className="text-xs text-red-800 font-semibold leading-relaxed whitespace-pre-wrap select-text pr-4">
                {errorText}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* STATE A: missing Firebase Auth client config */}
          {!isFirebaseAuthConfigured ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8"
              id="setup-wizard"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-amber-600 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1">Firebase Auth Setup Required</h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-semibold">
                    To connect with Google, this frontend needs Firebase web app credentials exposed as Vite environment variables.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-6 text-sm text-slate-705 space-y-4">
                <h4 className="font-extrabold text-slate-950 border-b border-slate-200 pb-2 mb-2">Firebase Web App Settings:</h4>
                <ol className="list-decimal pl-5 space-y-3 leading-relaxed text-xs font-semibold text-slate-600">
                  <li>
                    Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold inline-flex items-center gap-0.5 hover:underline">Firebase Console <Key className="w-3.5 h-3.5 inline" /></a>.
                  </li>
                  <li>
                    Create or select a Firebase project and add a <strong>Web App</strong>.
                  </li>
                  <li>
                    Enable <strong>Authentication &gt; Sign-in method &gt; Google</strong>.
                  </li>
                  <li>
                    Add these public Firebase web config values to the local Vite environment:
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5 font-mono text-xs text-slate-800 font-bold">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">VITE_FIREBASE_API_KEY</div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">VITE_FIREBASE_AUTH_DOMAIN</div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">VITE_FIREBASE_PROJECT_ID</div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">VITE_FIREBASE_STORAGE_BUCKET</div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">VITE_FIREBASE_MESSAGING_SENDER_ID</div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">VITE_FIREBASE_APP_ID</div>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                <p className="text-xs text-slate-400 select-none">
                  Reload the tab after configuring Firebase environment values.
                </p>
                <button
                  onClick={fetchConfig}
                  className="bg-slate-900 border border-slate-950 hover:bg-black text-white font-extrabold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm select-none"
                  id="reload-config-button"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Session</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* STATE B: Firebase Auth config exists. Route through Wizard Slides */
            <div className="space-y-6">
              {currentSlide === "auth" && (
                <AuthSlide
                  isLoggingIn={isLoggingIn}
                  handleConnect={handleConnect}
                />
              )}

              {currentSlide === "search" && (
                <SearchSlide
                  subjectInput={subjectInput}
                  setSubjectInput={setSubjectInput}
                  isSearching={isSearching}
                  emails={emails}
                  handleSearch={handleSearch}
                  selectedIds={selectedEmailIds}
                  toggleSelectAll={toggleSelectAll}
                  toggleSelect={toggleSelect}
                  expandedIds={expandedEmailIds}
                  toggleExpand={toggleExpand}
                  copyToClipboard={copyToClipboard}
                  handleAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                />
              )}

              {currentSlide === "schema" && (
                <SchemaSlide
                  detectedType={analysisResult?.detectedType || "Custom"}
                  explanation={analysisResult?.explanation || ""}
                  schemaFields={schemaFields}
                  setSchemaFields={setSchemaFields}
                  onProceedToScript={() => setCurrentSlide("script")}
                />
              )}

              {currentSlide === "script" && (
                <ScriptSlide
                  scriptCode={scriptCode}
                  setScriptCode={setScriptCode}
                  aiScriptCode={analysisResult?.aiScriptCode || ""}
                  testEmails={emails.filter((m) => selectedEmailIds.has(m.id))}
                  backendHeaders={createBackendHeadersForSession(firebaseSession, true)}
                  isSaving={isSavingExtractor}
                  onSaveExtractor={handleSaveExtractor}
                />
              )}

              {currentSlide === "dashboard" && (
                <DashboardSlide
                  extractors={extractors}
                  isLoading={loadingExtractors}
                  onRunScan={handleRunScan}
                  onToggleSchedule={handleToggleSchedule}
                  onUpdateWebhook={handleUpdateWebhook}
                />
              )}

              {currentSlide === "tickets" && firebaseSession && (
                <TicketsSlide
                  currentUser={{
                    uid: firebaseSession.user.uid,
                    email: firebaseSession.user.email,
                    displayName: firebaseSession.user.displayName,
                  }}
                />
              )}
            </div>
          )}

        </AnimatePresence>

      </main>

      {firebaseSession && (
        <footer className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-8px_30px_rgba(15,23,42,0.06)]">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setCurrentSlide("tickets")}
              className={`h-11 px-4 rounded-2xl border flex items-center justify-center gap-2 text-xs font-extrabold cursor-pointer transition-all ${
                currentSlide === "tickets"
                  ? "bg-slate-900 border-slate-950 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              title="Tickets"
            >
              <Bug className="w-4 h-4" />
              <span>Tickets</span>
            </button>
          </div>
        </footer>
      )}

    </div>
  );
}
