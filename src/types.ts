export type TaskStatus = 'pending' | 'completed' | 'cancelled';
export type UrgencyLevel = 'non-urgent' | 'little-urgent' | 'urgent' | 'extremely-urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueAtUtc: string;
  timezone: string;
  categoryId: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  scheduledNotifications?: ScheduledNotification[];
}

export interface ScheduledNotification {
  notificationId: string;
  type: 'alarm' | 'notification';
  triggerAtUtc: string;
}

export interface CategoryTemplate {
  alarmOffsets: number[];
  notificationOffsets: number[];
}

export interface Category {
  id: string;
  name: string;
  urgencyLevel: UrgencyLevel;
  defaultTemplate: CategoryTemplate;
  userOverrides?: Partial<CategoryTemplate>;
}
