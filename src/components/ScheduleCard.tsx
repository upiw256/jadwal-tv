import type { ScheduleItem } from '../types/schedule';
import type { TeacherInfo } from '../hooks/useTeachers';

export function ScheduleCard({ item, grade, teacherMap }: { item: ScheduleItem; grade: string; teacherMap: Record<string, TeacherInfo> }) {
  const teachers = item.list_kode_guru.map((code) => teacherMap[code]);
  const names = item.list_kode_guru.map((code, index) => teachers[index]?.nama ?? code);
  const subjects = [...new Set(teachers.map((teacher) => teacher?.mapel).filter((subject): subject is string => Boolean(subject)))];
  return (
    <article className="schedule-card card h-full w-full flex-none border border-base-300 border-l-4 border-l-primary bg-base-100 shadow-sm">
      <div className="card-body flex-row items-center gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-8">
        <div className="flex w-28 shrink-0 flex-col items-center border-r border-base-300 pr-4 sm:w-40 sm:pr-6">
          <span className="text-xs font-semibold tracking-widest text-base-content/60 sm:text-sm">KELAS {grade}</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">{item.kelas}</h2>
        </div>
        <div className="grid min-w-0 flex-1 gap-x-6 gap-y-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-center sm:gap-x-10">
          <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
            <span className="text-xl font-semibold tabular-nums text-base-content sm:text-3xl lg:text-4xl">{item.waktu}</span>
            <span className="badge badge-ghost badge-md">Jam ke-{item.jam_ke_clean + 1}</span>
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold tracking-widest text-base-content/50 sm:text-sm">GURU PENGAJAR</p>
            <p className="text-lg font-semibold leading-snug sm:text-xl lg:text-2xl">{names.length ? names.join(', ') : 'Guru belum tercantum'}</p>
            <p className="mt-1 text-base text-primary sm:text-lg">{subjects.length ? subjects.join(', ') : 'Mata pelajaran belum tercantum'}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
