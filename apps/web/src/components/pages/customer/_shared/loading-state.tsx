import { ReactNode } from 'react';
import { CustomerStateBlock } from './customer-state-block';

interface LoadingStateProps {
  message?: string;
  action?: ReactNode;
}

export function LoadingState({ message = 'Loading...', action }: LoadingStateProps) {
  return <CustomerStateBlock mode="loading" message={message} action={action} />;
}
