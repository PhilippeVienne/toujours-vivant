import { UserStatus } from '@/types';

interface CheckInStatusInput {
  lastPingAt?: string | null;
  pingFrequencyMinutes?: number;
  status?: UserStatus;
  offlineUntil?: string | null;
}

/**
 * Computes the realtime OK/WARNING/ALERT/PAUSED status from a user's last check-in.
 * While `offlineUntil` is in the future, the user stays PAUSED (no alert).
 * Once it passes, the countdown resumes from `offlineUntil` rather than the
 * (now stale) last ping, so returning travelers get a full grace window.
 */
export function computeRealtimeUserStatus(user: CheckInStatusInput) {
  const customMinutes = user.pingFrequencyMinutes || 720;
  const totalAllowedSeconds = customMinutes * 60;
  const nowMs = Date.now();

  if (user.status === 'PAUSED' && user.offlineUntil) {
    const offlineUntilMs = new Date(user.offlineUntil).getTime();
    if (nowMs < offlineUntilMs) {
      return {
        status: 'PAUSED' as UserStatus,
        secondsRemaining: Math.max(0, Math.floor((offlineUntilMs - nowMs) / 1000)),
        elapsedSeconds: 0,
      };
    }
  }

  if (!user.lastPingAt) {
    return {
      status: 'OK' as UserStatus,
      secondsRemaining: totalAllowedSeconds,
      elapsedSeconds: 0,
    };
  }

  const lastPingMs = new Date(user.lastPingAt).getTime();
  const offlineUntilMs = user.offlineUntil ? new Date(user.offlineUntil).getTime() : 0;
  const baselineMs = Math.max(lastPingMs, offlineUntilMs);
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - baselineMs) / 1000));
  const secondsRemaining = Math.max(0, totalAllowedSeconds - elapsedSeconds);

  let status: UserStatus = 'OK';
  if (secondsRemaining <= 0) {
    status = 'ALERT';
  } else if (secondsRemaining <= 300) {
    status = 'WARNING';
  }

  return {
    status,
    secondsRemaining,
    elapsedSeconds,
  };
}
