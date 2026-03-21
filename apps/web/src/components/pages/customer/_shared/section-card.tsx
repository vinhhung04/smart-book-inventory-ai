import { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, subtitle, actions, children, className = '' }: SectionCardProps) {
  return (
    <section className={`rounded-[14px] border border-slate-200 bg-white p-4 md:p-5 ${className}`}>
      {title || subtitle || actions ? (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title ? (
              <h3 className="text-[16px] text-slate-900" style={{ fontWeight: 700 }}>
                {title}
              </h3>
            ) : null}
            {subtitle ? <p className="mt-0.5 text-[12px] text-slate-500">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
