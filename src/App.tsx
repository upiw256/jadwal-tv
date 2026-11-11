import { useEffect, useState } from 'react';
import { ScheduleCard } from './components/ScheduleCard';
import { useNewsTicker } from './hooks/useNewsTicker';
import { useSchedule } from './hooks/useSchedule';
import { useTeachers } from './hooks/useTeachers';
import type { TeacherInfo } from './hooks/useTeachers';
import type { ScheduleItem } from './types/schedule';
import { getHariIndonesia, isAktif } from './utils/time';

const SLIDE_DURATION = 6_000;
const GRADES = ['X', 'XI', 'XII'] as const;
type Grade = (typeof GRADES)[number];

function getGrade(kelas: string): Grade | null {
  const prefix = /^(XII|XI|X)(?=$|[\s/-])/i.exec(kelas.trim())?.[1];
  return prefix?.toUpperCase() as Grade | undefined ?? null;
}

function GradeRow({ grade, items, teacherMap }: { grade: Grade; items: ScheduleItem[]; teacherMap: Record<string, TeacherInfo> }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [animated, setAnimated] = useState(true);
  const looping = items.length > 1;
  const slides = looping ? [...items, items[0]] : items;

  useEffect(() => {
    if (!looping) return;
    const interval = window.setInterval(() => setSlideIndex((index) => index + 1), SLIDE_DURATION);
    return () => window.clearInterval(interval);
  }, [looping, items.length]);

  useEffect(() => {
    if (!looping || slideIndex !== items.length) return;
    const timeout = window.setTimeout(() => {
      setAnimated(false);
      setSlideIndex(0);
      window.requestAnimationFrame(() => setAnimated(true));
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [looping, slideIndex, items.length]);

  const offset = `calc(-${slideIndex * 100}% - ${slideIndex * 1.5}rem)`;
  return (
    <div className="row-carousel" aria-label={`Kelas ${grade}, ${items.length} kelas aktif`} aria-live="off">
      {items.length > 0 ? (
        <div className="row-track" style={{ transform: `translate3d(${offset}, 0, 0)`, transition: animated ? undefined : 'none' }}>
          {slides.map((item, index) => <ScheduleCard key={`${item.kelas}-${item.jam_ke_clean}-${index}`} grade={grade} item={item} teacherMap={teacherMap} />)}
        </div>
      ) : (
        <div className="card h-full border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body flex-row items-center gap-5 p-4 sm:p-6">
            <span className="badge badge-primary badge-outline badge-lg">KELAS {grade}</span>
            <div><h2 className="font-semibold">Belum ada kelas aktif</h2><p className="text-sm text-base-content/60">Jadwal tingkat {grade} akan muncul di sini.</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { schedule, now, loading, error, refresh } = useSchedule();
  const newsMessage = useNewsTicker();
  const teacherMap = useTeachers();
  const currentItems = schedule.filter((item) => isAktif(item, now));
  const clock = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
  const date = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' }).format(now);

  return (
    <main className="h-screen overflow-hidden bg-base-200 px-4 py-4 text-base-content sm:px-8 sm:py-5 lg:px-16">
      <div className="mx-auto flex h-full max-w-[1920px] flex-col">
        <header className="navbar mb-3 min-h-0 shrink-0 rounded-2xl border border-base-300 bg-base-100 px-4 py-3 shadow-sm sm:mb-4 sm:px-6">
          <div className="flex flex-1 items-center gap-3">
            <img className="school-logo" src="/assets/Logo_sekolah.png" alt="Logo SMA Negeri 1 Margaasih" />
            <div><p className="mb-0.5 text-[10px] font-semibold tracking-widest text-base-content/60 sm:text-xs">SMA NEGERI 1 MARGAASIH</p><h1 className="text-lg font-bold tracking-tight text-base-content sm:text-xl">Jadwal Pelajaran</h1></div>
          </div>
          <div className="text-right" aria-label={`Waktu Jakarta ${clock}`}><span className="block font-mono text-2xl font-semibold tracking-tight text-primary sm:text-4xl">{clock}</span><span className="text-xs capitalize text-base-content/60 sm:text-sm">{getHariIndonesia(now)}, {date} · WIB</span></div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col" aria-live="polite">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-3 sm:mb-3">
            <div><p className="mb-0.5 text-[10px] font-semibold tracking-widest text-primary sm:text-xs">PEMBARUAN LANGSUNG</p><h2 className="text-lg font-bold tracking-tight sm:text-2xl">Pelajaran sedang berlangsung</h2></div>
            <span className="badge badge-primary badge-outline badge-sm sm:badge-md">{currentItems.length} kelas aktif</span>
          </div>

          {loading ? <div className="alert mb-2 shrink-0 border-base-300 bg-base-100 py-2 text-base-content shadow-sm"><span className="loading loading-spinner loading-sm text-primary" /><span>Memuat jadwal…</span></div> : null}
          {!loading && error ? <div className="alert alert-error mb-2 shrink-0 py-2"><div><strong>Jadwal belum dapat dimuat.</strong><span className="block text-sm">{error}</span></div><button className="btn btn-primary btn-sm" type="button" onClick={() => void refresh()}>Coba lagi</button></div> : null}

          <div className="grade-rows">
            {GRADES.map((grade) => <GradeRow key={grade} grade={grade} items={currentItems.filter((item) => getGrade(item.kelas) === grade)} teacherMap={teacherMap} />)}
          </div>
        </section>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-base-300 pt-2 text-[10px] text-base-content/60 sm:pt-3 sm:text-xs">
          <span>Waktu server · WIB</span>
          <div className="footer-right">
            <img className="dinas-logo" src="/assets/Logo_dinas.png" alt="Logo Dinas Pendidikan" />
            <div className="news-ticker" aria-label={`Informasi sekolah: ${newsMessage}`}>
              <span className="badge badge-primary badge-sm shrink-0">INFO</span>
              <div className="news-window"><div className="news-track"><span>{newsMessage}</span><span aria-hidden="true">{newsMessage}</span></div></div>
            </div>
            <span className="flex shrink-0 items-center gap-2"><span className="status status-primary" />Sinkronisasi setiap 5 menit</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
