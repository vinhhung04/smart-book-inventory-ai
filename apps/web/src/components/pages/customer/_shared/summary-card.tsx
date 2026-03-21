import { ReactNode } from 'react';
import { CustomerStatCard } from './customer-stat-card';

interface SummaryCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}

export function SummaryCard(props: SummaryCardProps) {
  return <CustomerStatCard {...props} />;
}
