import { ReservationItem } from './reservation-item';

interface ReservationCardProps {
  item: any;
  onCancel: (id: string) => void;
}

export function ReservationCard({ item, onCancel }: ReservationCardProps) {
  return <ReservationItem item={item} onCancel={onCancel} />;
}
