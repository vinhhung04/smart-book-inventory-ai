import { ReactNode } from 'react';
import { CustomerStateBlock } from './customer-state-block';

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
  illustration?: ReactNode;
}

export function EmptyState({ message, action, illustration }: EmptyStateProps) {
  return <CustomerStateBlock mode="empty" message={message} action={action} illustration={illustration} />;
}
