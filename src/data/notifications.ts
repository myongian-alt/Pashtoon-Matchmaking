export type Notification = {
  id: string;
  title: string;
  subtitle: string;
  unread: boolean;
};

export const initialNotifications: Notification[] = [
  { id: '1', title: 'Interest received', subtitle: 'Amina has sent you a connection request.', unread: true },
  { id: '2', title: 'Premium offer', subtitle: 'Upgrade now for unlimited filter access.', unread: true },
  { id: '3', title: 'Match update', subtitle: 'New profiles matching your criteria added today.', unread: false },
];
