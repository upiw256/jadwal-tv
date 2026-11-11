import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScheduleItem } from '../types/schedule';

const API_URL = '/api/jadwal';

function isScheduleItem(value: unknown): value is ScheduleItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<ScheduleItem>;
  return typeof item.jam_ke_clean === 'number'
    && typeof item.hari === 'string'
    && typeof item.waktu === 'string'
    && typeof item.kelas === 'string'
    && Array.isArray(item.list_kode_guru)
    && item.list_kode_guru.every((code) => typeof code === 'string');
}

export function useSchedule() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const fetchSchedule = useCallback(async () => {
    try {
      const requestStarted = Date.now();
      const response = await fetch(API_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Server menjawab ${response.status}`);
      const receivedAt = Date.now();
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const serverTime = new Date(dateHeader).getTime();
        if (Number.isFinite(serverTime)) {
          // Header Date beresolusi detik; titik tengah mengurangi bias latensi.
          offsetRef.current = serverTime - (requestStarted + receivedAt) / 2;
        }
      }
      const data: unknown = await response.json();
      if (!Array.isArray(data) || !data.every(isScheduleItem)) {
        throw new Error('Format data jadwal dari API tidak sesuai.');
      }
      setSchedule(data);
      setError(null);
    } catch (cause) {
      console.error('Gagal mengambil jadwal:', cause);
      setError(cause instanceof Error ? cause.message : 'Terjadi kesalahan saat mengambil jadwal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let timeoutId = 0;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const currentTime = new Date(Date.now() + offsetRef.current);
      setNow(currentTime);
      const msToNextSecond = 1_000 - currentTime.getMilliseconds();
      timeoutId = window.setTimeout(tick, msToNextSecond + 10);
    };
    tick();
    return () => {
      stopped = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    void fetchSchedule();
    const id = window.setInterval(() => void fetchSchedule(), 5 * 60_000);
    return () => window.clearInterval(id);
  }, [fetchSchedule]);

  return { schedule, now, loading, error, refresh: fetchSchedule };
}
