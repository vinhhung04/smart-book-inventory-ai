import { ReactNode } from 'react';

interface InfoCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}

export function InfoCard({ label, value, hint, className = '' }: InfoCardProps) {
  return (
    <div className={`rounded-[12px] border border-slate-200 bg-white p-4 ${className}`}>
      <div className="text-[11px] uppercase tracking-[0.05em] text-slate-400">{label}</div>
      <div className="mt-1 text-[14px] text-slate-900" style={{ fontWeight: 700 }}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-[12px] text-slate-500">{hint}</div> : null}
    </div>
  );
}
