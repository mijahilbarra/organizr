import React from "react";

interface NewOperationToastProps {
  timeLabel: string;
}

export const NewOperationToast: React.FC<NewOperationToastProps> = ({ timeLabel }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">Nueva operacion</p>
      <p className="mt-1 text-sm font-bold text-emerald-950">{timeLabel}</p>
    </div>
  );
};
