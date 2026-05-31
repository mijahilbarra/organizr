import React, { useState } from "react";
import { Code, Eye, FileText, CheckCircle2, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { EmailMessage, SchemaField } from "../../types";

interface ScriptSlideProps {
  scriptCode: string;
  setScriptCode: (code: string) => void;
  aiScriptCode: string;
  testEmails: EmailMessage[];
  backendHeaders: Record<string, string>;
  isSaving: boolean;
  onSaveExtractor: (name: string) => void;
}

/**
 * Slide 4: Real-time Script Compiler, Sandbox Sandbox testing, and Persisting.
 */
export const ScriptSlide: React.FC<ScriptSlideProps> = ({
  scriptCode,
  setScriptCode,
  aiScriptCode,
  testEmails,
  backendHeaders,
  isSaving,
  onSaveExtractor,
}) => {
  const [activeTab, setActiveTab] = useState<"regex" | "ai">("regex");
  const [extractorName, setExtractorName] = useState("");
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestScript = async () => {
    try {
      setIsTesting(true);
      setTestError(null);
      
      const res = await fetch("/api/extractors/test", {
        method: "POST",
        headers: backendHeaders,
        body: JSON.stringify({
          scriptCode,
          emails: testEmails,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Execution failed during script evaluation.");
      }

      setTestResults(data.results || []);
    } catch (err: any) {
      console.error(err);
      setTestError(err.message || "Something went wrong during local testing.");
      setTestResults(null);
    } finally {
      setIsTesting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractorName.trim()) return;
    onSaveExtractor(extractorName.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="max-w-5xl mx-auto space-y-6"
      id="slide-script"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Script Editor/Preview & Tabs */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-slate-500" /> Code Assembly & Review
            </h3>
            <div className="flex bg-slate-100 rounded-xl p-0.5 select-none text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("regex")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === "regex" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                JS Extractor (Exact regex)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === "ai" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                AI Fallback (Gemini SDK)
              </button>
            </div>
          </div>

          {activeTab === "regex" ? (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-slate-500 text-xs leading-relaxed">
                Gemini compiled a specialized, zero-cloud JavaScript routine mapping strict RegExp matches in memory. Correct any paths or logic directly if necessary.
              </p>
              <textarea
                value={scriptCode}
                onChange={(e) => setScriptCode(e.target.value)}
                rows={16}
                className="w-full font-mono text-xs bg-slate-900 text-slate-200 p-4 border border-slate-950 rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500 overflow-x-auto select-text shadow-sm"
                style={{ scrollbarWidth: "thin" }}
                id="script-code-editor"
              />
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-slate-500 text-xs leading-relaxed">
                Alternative SDK implementation detailing how to configure structured output schemas for standard Node backend deployments using `@google/genai` packages.
              </p>
              <pre
                className="w-full font-mono text-[11px] bg-slate-950 hover:bg-slate-950/95 text-green-400 p-4 rounded-2xl overflow-x-auto whitespace-pre select-text h-[350px] shadow-sm"
                style={{ scrollbarWidth: "thin" }}
              >
                {aiScriptCode || "// Alternative script block did not generate."}
              </pre>
            </div>
          )}

          <div className="flex gap-3 justify-start border-t border-slate-100 pt-3">
            <button
              onClick={handleTestScript}
              disabled={isTesting || activeTab !== "regex"}
              className="py-2.5 px-4 rounded-xl font-bold bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 hover:border-indigo-200 text-indigo-600 text-xs transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer"
              id="test-script-sandbox"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Test Extract Script</span>
            </button>
          </div>
        </div>

        {/* Right Col: Persisting & Sandbox Outputs */}
        <div className="space-y-6">
          
          {/* Configure & Save Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Save Extractor
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Name this extractor template (e.g., Stripe Invoice, Github Release) to persist it to your dashboard. This saves your initial dataset extractions as the first record block.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Extractor Name</label>
                <input
                  type="text"
                  value={extractorName}
                  onChange={(e) => setExtractorName(e.target.value)}
                  placeholder="e.g. Booking Engine Extractor"
                  className="w-full bg-slate-50 hover:bg-slate-50/70 focus:bg-white border border-slate-200 hover:border-slate-350 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-100 rounded-xl px-3.5 py-2.5 text-xs transition-all text-slate-800"
                  required
                  id="extractor-name-input"
                />
              </div>

              <button
                type="submit"
                disabled={!extractorName.trim() || isSaving}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-with font-extrabold text-white text-xs disabled:opacity-50 transition-all select-none cursor-pointer shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
                id="save-extractor-action"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Save Extractor</span>
              </button>
            </form>
          </div>

          {/* Test Sandbox feedback */}
          {(testResults || testError || isTesting) && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
              <h4 className="text-xs uppercase tracking-wide font-extrabold text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Test Sandbox Logs
              </h4>

              {isTesting && (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                  Compiling extractor logic in runtime context...
                </div>
              )}

              {testError && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-xs leading-relaxed flex gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-red-800 mb-0.5">Execution Failed</h5>
                    {testError}
                  </div>
                </div>
              )}

              {testResults && (
                <div className="space-y-3 max-h-56 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                  <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-block">
                    Compilation and execution succeeded!
                  </span>
                  
                  {testResults.map((res: any, idx: number) => {
                    let fieldsObj = {};
                    try { fieldsObj = JSON.parse(res.extractedData); } catch(e) {}
                    const isRecordError = res.error || (fieldsObj && (fieldsObj as any).error);

                    return (
                      <div key={res.emailId} className="border-b border-slate-100 pb-2.5 last:border-0 last:pb-0 text-[11px]">
                        <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wide">
                          EMail #{idx + 1} ({res.emailId.substring(0,6)}...)
                        </span>
                        
                        {isRecordError ? (
                          <div className="text-red-500 font-medium pl-1 text-[10px]">
                            {res.error || (fieldsObj as any).error}
                          </div>
                        ) : (
                          <pre className="p-2 bg-slate-50 border border-slate-100 rounded-lg overflow-x-auto text-[10px] font-mono text-slate-700 mt-1 select-text">
                            {JSON.stringify(fieldsObj, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </motion.div>
  );
};
