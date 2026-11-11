import { useEffect, useState } from 'react';

const TEACHERS_URL = '/api/guru';
type TeacherResponse = Record<string, { nama?: unknown; mapel?: unknown }>;
export interface TeacherInfo {
  nama: string;
  mapel: string;
}

export function useTeachers() {
  const [teacherMap, setTeacherMap] = useState<Record<string, TeacherInfo>>({});

  useEffect(() => {
    let cancelled = false;
    const fetchTeachers = async () => {
      try {
        const response = await fetch(TEACHERS_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Server guru menjawab ${response.status}`);
        const data: unknown = await response.json();
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          throw new Error('Format data guru dari API tidak sesuai.');
        }
        const map: Record<string, TeacherInfo> = {};
        for (const [code, value] of Object.entries(data as TeacherResponse)) {
          if (code !== 'No' && value && typeof value.nama === 'string') {
            map[code] = {
              nama: value.nama,
              mapel: typeof value.mapel === 'string' ? value.mapel : '',
            };
          }
        }
        if (!cancelled) setTeacherMap(map);
      } catch (error) {
        console.error('Gagal mengambil daftar guru:', error);
      }
    };

    void fetchTeachers();
    const interval = window.setInterval(() => void fetchTeachers(), 5 * 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return teacherMap;
}
