import { LoanItem } from './loan-item';

interface LoanCardProps {
  item: any;
  onView: (id: string) => void;
}

export function LoanCard({ item, onView }: LoanCardProps) {
  return <LoanItem item={item} onView={onView} />;
}
