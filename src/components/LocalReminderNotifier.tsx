'use client';

import { useLocalCheckinReminder } from '@/lib/useLocalCheckinReminder';

export function LocalReminderNotifier() {
  useLocalCheckinReminder();
  return null;
}
