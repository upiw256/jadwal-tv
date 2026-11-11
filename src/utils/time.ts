import type { ScheduleItem } from '../types/schedule';

const TIME_ZONE = 'Asia/Jakarta';

export function getHariIndonesia(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: TIME_ZONE,
    weekday: 'long',
  }).format(date).toUpperCase();
}

export function getMenitJakarta(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

export function toMenit(jam: string): number {
  const match = /^(\d{1,2})[.:](\d{2})$/.exec(jam.trim());
  if (!match) return Number.NaN;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return Number.NaN;
  return hour * 60 + minute;
}

export function isAktif(item: Pick<ScheduleItem, 'hari' | 'waktu'>, now: Date): boolean {
  if (item.hari.trim().toUpperCase() !== getHariIndonesia(now)) return false;
  const match = /^\s*(.*?)\s*-\s*(.*?)\s*$/.exec(item.waktu);
  if (!match) return false;
  const mulai = toMenit(match[1]);
  const selesai = toMenit(match[2]);
  if (!Number.isFinite(mulai) || !Number.isFinite(selesai)) return false;
  const current = getMenitJakarta(now);
  return mulai <= selesai
    ? current >= mulai && current < selesai
    : current >= mulai || current < selesai;
}
