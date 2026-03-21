import { FineItem } from './fine-item';

interface FineCardProps {
  fine: any;
  paying: boolean;
  onPay: (fine: any, mode: 'PARTIAL' | 'FULL') => void;
}

export function FineCard({ fine, paying, onPay }: FineCardProps) {
  return <FineItem fine={fine} paying={paying} onPay={onPay} />;
}
