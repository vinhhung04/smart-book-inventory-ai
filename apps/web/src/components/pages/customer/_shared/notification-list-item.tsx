import { NotificationItem } from './notification-item';

interface NotificationListItemProps {
  item: any;
}

export function NotificationListItem({ item }: NotificationListItemProps) {
  return <NotificationItem item={item} />;
}
