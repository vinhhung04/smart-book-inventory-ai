import { ComponentProps } from 'react';
import { CustomerPageHeader } from './customer-page-header';

export type PageHeaderProps = ComponentProps<typeof CustomerPageHeader>;

export function PageHeader(props: PageHeaderProps) {
  return <CustomerPageHeader {...props} />;
}
