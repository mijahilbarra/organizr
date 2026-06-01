import React, { useState } from "react";
import { Table, Plus, Trash2, ChevronRight, Sparkles, ScrollText } from "lucide-react";
import { motion } from "motion/react";
import { SchemaField } from "../../types";

interface SchemaSlideProps {
  detectedType: string;
  explanation: string;
  schemaFields: SchemaField[];
  setSchemaFields: (fields: SchemaField[]) => void;
  onProceedToScript: () => void;
  analysisLogs: string[];
}

/**
 * Slide 3: Active Database Fields Schema Configurator.
 * Prompts user to audit Gemini's analyzed variables and add or tweak custom schema fields.
 */
export const SchemaSlide: React.FC<SchemaSlideProps> = ({
  detectedType,
  explanation,
  schemaFields,
  setSchemaFields,
  onProceedToScript,
  analysisLogs,
}) => {
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("string");
  const [newFieldDesc, setNewFieldDesc] = useState("");

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    // Convert newFieldName to camelCase automatically
    const camelCased = newFieldName
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, "");

    const newField: SchemaField = {
      fieldName: camelCased,
      fieldType: newFieldType,
      description: newFieldDesc.trim() || "Manual custom field.",
      exampleValue: "(Set after execution run)",
    };

    setSchemaFields([...schemaFields, newField]);
    setNewFieldName("");
    setNewFieldDesc("");
  };

  const handleDeleteField = (fieldName: string) => {
    setSchemaFields(schemaFields.filter((f) => f.fieldName !== fieldName));
  };

  const handleUpdateField = (index: number, updatedField: Partial<SchemaField>) => {
    const updated = [...schemaFields];
    updated[index] = { ...updated[index], ...updatedField };
    setSchemaFields(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="max-w-5xl mx-auto space-y-6"
      id="slide-schema"
    >
      {/* Category Intelligence Header */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-5 items-start">
        <div className="bg-white border border-indigo-200/60 p-4 rounded-2xl shadow-sm shrink-0 flex items-center justify-center text-indigo-600">
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide font-extrabold text-indigo-500">Gemini Intelligence Report</span>
            <span className="bg-indigo-100 text-indigo-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
              {detectedType}
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">
            Recommended Extraction Blueprint
          </h3>
          <p className="text-slate-655 text-sm leading-relaxed">
            {explanation || "The language model has analyzed your email structure and formulated a matching target database fields proposal."}
          </p>
        </div>
      </div>

      {analysisLogs.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-indigo-200">
            <ScrollText className="w-3.5 h-3.5" />
            <span>Gemini Refinement Log</span>
          </div>
          <div className="grid gap-1.5 font-mono text-[11px] leading-relaxed text-slate-300 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {analysisLogs.map((log, index) => (
              <div key={`${index}-${log}`}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Blueprint Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Schema Fields Editor Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Table className="w-4 h-4 text-slate-500" /> Audit Extracted Fields ({schemaFields.length})
          </h4>

          <div className="overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  <th className="pb-3 pl-1">Variable</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {schemaFields.map((field, idx) => (
                  <tr key={field.fieldName} className="group hover:bg-slate-50/20 transition-all">
                    <td className="py-3 pl-1 pr-2 align-middle font-mono font-bold text-indigo-600">
                      <input
                        type="text"
                        value={field.fieldName}
                        onChange={(e) => handleUpdateField(idx, { fieldName: e.target.value })}
                        className="bg-transparent hover:bg-slate-100/50 focus:bg-white border-0 hover:border focus:border border-slate-200 rounded-lg px-2 py-1 font-mono text-xs w-28 text-indigo-600 uppercase tracking-tight focus:outline-none focus:ring-1 focus:ring-indigo-200"
                      />
                    </td>
                    <td className="py-3 pr-2 align-middle">
                      <select
                        value={field.fieldType}
                        onChange={(e) => handleUpdateField(idx, { fieldType: e.target.value })}
                        className="bg-transparent hover:bg-slate-100/50 focus:bg-white border border-slate-200 select-none rounded-lg px-2 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-100 cursor-pointer"
                      >
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                        <option value="array">array</option>
                      </select>
                    </td>
                    <td className="py-3 pr-2 align-middle text-slate-655 font-medium">
                      <input
                        type="text"
                        value={field.description}
                        onChange={(e) => handleUpdateField(idx, { description: e.target.value })}
                        className="bg-transparent hover:bg-slate-100/50 focus:bg-white border-0 hover:border focus:border border-slate-200 rounded-lg px-2 py-1 text-xs w-full text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                      />
                    </td>
                    <td className="py-3 text-right align-middle">
                      <button
                        onClick={() => handleDeleteField(field.fieldName)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
                        id={`delete-field-${field.fieldName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={onProceedToScript}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 select-none cursor-pointer group"
              id="confirm-schema-button"
            >
              <span>Build Parser Script</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Add custom variables Form */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 self-start">
          <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" /> Insert Custom Field
          </h4>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Need additional metadata variables? Map custom fields manually to instruct the extractor compiler.
          </p>

          <form onSubmit={handleAddField} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Variable Name</label>
              <input
                type="text"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="e.g. invoiceNumber or trackingId"
                className="w-full bg-slate-50 hover:bg-slate-50/70 focus:bg-white border border-slate-200 hover:border-slate-350 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-100 rounded-xl px-3.5 py-2.5 text-xs transition-all font-mono text-indigo-600"
                required
                id="new-field-name-input"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Input Datatype</label>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-50/70 focus:bg-white border border-slate-200 select-none rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-105 cursor-pointer"
              >
                <option value="string">string (Textual letters/lines)</option>
                <option value="number">number (Integer or floats)</option>
                <option value="boolean">boolean (True or false toggle)</option>
                <option value="array">array (Collection of items)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Brief Description</label>
              <textarea
                value={newFieldDesc}
                onChange={(e) => setNewFieldDesc(e.target.value)}
                placeholder="Where does this field live inside the email layouts?"
                rows={2}
                className="w-full bg-slate-50 hover:bg-slate-50/70 focus:bg-white border border-slate-200 hover:border-slate-350 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-100 rounded-xl px-3.5 py-2.5 text-xs transition-all text-slate-600 leading-relaxed"
                id="new-field-desc-input"
              />
            </div>

            <button
              type="submit"
              disabled={!newFieldName.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs disabled:opacity-50 transition-all select-none cursor-pointer"
              id="add-custom-field-action"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Insert Blueprint Field</span>
            </button>
          </form>
        </div>

      </div>
    </motion.div>
  );
};
