# Panduan Lengkap Membangun Aplikasi Jadwal Pelajaran Realtime untuk Smart TV Sekolah

**API sumber:** `https://jadwal.sman1margaasih.sch.id/api/jadwal`
**Teknologi:** React + TypeScript + Vite + Tailwind CSS

**Fitur utama:**
* Menampilkan card kelas yang sedang berlangsung pada jam server.
* Card berisi: nama kelas, jam, dan nama guru (dari mapping kode guru).
* Update otomatis tepat saat pergantian menit (bukan polling 60 detik).
* Menggunakan timezone Asia/Jakarta dan offset waktu server.
* Tampilan dioptimalkan untuk Smart TV (font besar, kontras tinggi).

---

## 1. Analisis Data API

Contoh respons:

```json
[
  {
    "jam_ke_clean": 0,
    "hari": "SENIN",
    "waktu": "06.30 - 07.10",
    "kelas": "X-1",
    "list_kode_guru": ["U", "P", "A"]
  },
  {
    "jam_ke_clean": 1,
    "hari": "SENIN",
    "waktu": "07.10 - 07.50",
    "kelas": "X-1",
    "list_kode_guru": ["48B"]
  }
]
```

**Catatan penting:**
* API tidak menyediakan nama mata pelajaran, hanya kelas, waktu, dan `list_kode_guru`.
* Nama guru harus dipetakan dari kode guru.
* Format waktu: `HH.MM - HH.MM` (pemisah titik).

---

## 2. Persiapan Lingkungan

```bash
npm create vite@latest jadwal-tv -- --template react-ts
cd jadwal-tv
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Konfigurasi `tailwind.config.js`:

```js
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

Tambahkan di `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 3. Struktur Proyek

```text
src/
├── components/
│   └── ScheduleCard.tsx
├── hooks/
│   └── useSchedule.ts
├── types/
│   └── schedule.ts
├── utils/
│   ├── teacherMapping.ts
│   └── time.ts
├── App.tsx
└── main.tsx
```

---

## 4. Definisikan Tipe Data

`src/types/schedule.ts`:

```ts
export interface ScheduleItem {
  jam_ke_clean: number;
  hari: string;
  waktu: string;
  kelas: string;
  list_kode_guru: string[];
}
```

---

## 5. Mapping Kode Guru ke Nama

`src/utils/teacherMapping.ts`:

```ts
export const teacherMap: Record<string, string> = {
  "48B": "Budi Santoso, S.Pd.",
  "16": "Siti Aminah, M.Pd.",
  "U": "Drs. H. Umar",
  "P": "Purnomo, S.Pd.",
  "A": "Aminah, S.Pd.",
  // lengkapi sesuai data sekolah
};
```

---

## 6. Utilitas Waktu (Server + Timezone)

`src/utils/time.ts`:

```ts
export function getHariIndonesia(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
  })
    .format(date)
    .toUpperCase();
}

export function getMenitJakarta(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

export function toMenit(jam: string): number {
  const [h, m] = jam.split(".").map(Number);
  return h * 60 + m;
}

export function isAktif(item: { hari: string; waktu: string }, now: Date): boolean {
  if (item.hari !== getHariIndonesia(now)) return false;
  const [mulai, selesai] = item.waktu.split(" - ").map(toMenit);
  const menitSekarang = getMenitJakarta(now);
  return menitSekarang >= mulai && menitSekarang < selesai;
}
```

---

## 7. Hook Pengambilan Data + Offset Waktu Server

`src/hooks/useSchedule.ts`:

```ts
import { useState, useEffect, useRef } from "react";
import type { ScheduleItem } from "../types/schedule";

const API_URL = "https://jadwal.sman1margaasih.sch.id/api/jadwal";

export function useSchedule() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const offsetRef = useRef(0); // selisih waktu server - perangkat (ms)

  // Ambil data + offset dari header Date
  const fetchSchedule = async () => {
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      const dateHeader = res.headers.get("date");
      if (dateHeader) {
        const serverTime = new Date(dateHeader).getTime();
        offsetRef.current = serverTime - Date.now();
      }
      const data: ScheduleItem[] = await res.json();
      setSchedule(data);
    } catch (err) {
      console.error("Gagal mengambil jadwal:", err);
    } finally {
      setLoading(false);
    }
  };

  // Timer presisi: update tepat di awal menit berikutnya
  useEffect(() => {
    let timeoutId: number;

    const tick = () => {
      const serverNow = new Date(Date.now() + offsetRef.current);
      setNow(serverNow);

      const msToNextMinute =
        60_000 - (serverNow.getSeconds() * 1000 + serverNow.getMilliseconds());

      timeoutId = window.setTimeout(tick, msToNextMinute + 50);
    };

    tick();
    return () => clearTimeout(timeoutId);
  }, []);

  // Refresh data API tiap 5 menit
  useEffect(() => {
    fetchSchedule();
    const id = setInterval(fetchSchedule, 5 * 60_000);
    return () => clearInterval(id);
  }, []);

  return { schedule, now, loading };
}
```

*Catatan CORS:* Jika header Date tidak terbaca, server API perlu menambahkan `Access-Control-Expose-Headers: Date`. Alternatifnya, buat endpoint `/api/time` yang mengembalikan waktu server.

---

## 8. Komponen Card Jadwal

`src/components/ScheduleCard.tsx`:

```tsx
import type { ScheduleItem } from "../types/schedule";
import { teacherMap } from "../utils/teacherMapping";

interface Props {
  item: ScheduleItem;
}

export function ScheduleCard({ item }: Props) {
  const guru = item.list_kode_guru
    .map((kode) => teacherMap[kode] ?? kode)
    .join(", ");

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 min-w-[280px] border-l-8 border-blue-600">
      <h2 className="text-4xl font-extrabold text-gray-800">{item.kelas}</h2>
      <p className="text-2xl text-gray-500 mt-2">{item.waktu}</p>
      <p className="text-3xl font-semibold text-blue-700 mt-3">
        {guru || "Guru tidak diketahui"}
      </p>
    </div>
  );
}
```

---

## 9. Komponen Utama (Filter Jadwal Aktif)

`src/App.tsx`:

```tsx
import { useSchedule } from "./hooks/useSchedule";
import { ScheduleCard } from "./components/ScheduleCard";
import { isAktif } from "./utils/time";

export default function App() {
  const { schedule, now, loading } = useSchedule();

  const currentItems = schedule.filter((item) => isAktif(item, now));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-4xl">
        Memuat jadwal…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-5xl font-bold mb-8 text-gray-800">
        Jadwal Pelajaran Sekarang
      </h1>
      {currentItems.length === 0 ? (
        <p className="text-3xl text-gray-500">Tidak ada pelajaran aktif.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentItems.map((item) => (
            <ScheduleCard
              key={`${item.kelas}-${item.jam_ke_clean}`}
              item={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 10. Menjalankan & Menguji

```bash
npm run dev
```

Buka `http://localhost:5173`.

**Skenario uji:**
* Ubah jam perangkat beberapa menit sebelum 09.00 → card belum muncul.
* Tepat pukul 09.00 (jam server) → card muncul dalam ≤50 ms.
* Pukul 09.40 → card hilang / berganti ke jadwal berikutnya.

---

## 11. Build & Deploy

```bash
npm run build
```

Upload folder `dist` ke hosting statis (Vercel, Netlify, atau server sekolah). Di Smart TV, buka URL hasil deploy dan gunakan mode fullscreen/kiosk.

---

## 12. Tips Tambahan

* **Navigasi remote:** Gunakan `@smart-tv/ui` atau library sejenis jika perlu fokus antar card.
* **Penanganan error:** Tampilkan pesan jika API gagal.
* **Mapping guru:** Simpan di JSON terpisah jika datanya banyak.
* **Nama pelajaran:** API tidak menyediakannya; tambahkan mapping manual jika diperlukan.

---

## Kesimpulan

Dengan panduan ini:
* Card hanya menampilkan pelajaran yang sedang berlangsung pada jam server.
* Perubahan terjadi tepat di pergantian menit, bukan menunggu polling.
* Waktu mengikuti Asia/Jakarta dan offset server, sehingga akurat meski jam TV meleset.