/**
 * Contextual duration string: seconds/minutes only near urgency, hours+minutes
 * for the same day, days+hours beyond that. Avoids raw "711 minutes"-style output.
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);

  if (days > 0) return hours > 0 ? `${days} j ${hours}h` : `${days} j`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes.toString().padStart(2, '0')}m` : `${hours}h`;
  if (minutes > 0) return `${minutes} min`;
  return `${s} s`;
}

export function formatDurationMinutes(totalMinutes: number): string {
  return formatDuration(totalMinutes * 60);
}

/**
 * "Aujourd'hui à 14:47" / "Hier à 09:12" / "lundi à 18:03" (this week) / full
 * date beyond that — instead of a bare hour that loses the day, or a always-full
 * date that's needlessly verbose for a recent ping.
 */
export function formatRelativeDateTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (diffDays === 0) return `Aujourd'hui à ${time}`;
  if (diffDays === 1) return `Hier à ${time}`;
  if (diffDays > 1 && diffDays < 7) {
    const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} à ${time}`;
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  const day = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });
  return `${day} à ${time}`;
}

/**
 * Same idea as formatRelativeDateTime but for tight list/timeline columns:
 * "14:47" (today) / "Hier 09:12" / "lun. 18:03" (this week) / "2 août 14:47".
 */
export function formatRelativeTimeCompact(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (diffDays === 0) return time;
  if (diffDays === 1) return `Hier ${time}`;
  if (diffDays > 1 && diffDays < 7) {
    const weekday = date.toLocaleDateString('fr-FR', { weekday: 'short' });
    return `${weekday} ${time}`;
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  const day = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });
  return `${day} ${time}`;
}
