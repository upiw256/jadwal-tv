# Jadwal TV SMA Negeri 1 Margaasih

Aplikasi jadwal realtime untuk layar sekolah. Jam mengikuti header waktu server dari API jadwal. API jadwal dan guru diproxy melalui Nginx agar bisa diakses dari origin aplikasi.

## Jalankan dengan Docker

```sh
docker compose up -d --build
```

Buka `http://localhost:8080`.

## Mengubah berita ticker

Edit `public/news.txt`. Docker Compose memasang file tersebut langsung ke container, sehingga perubahan tampil tanpa build ulang. Browser memeriksa file setiap dua detik. Tulis setiap pengumuman pada baris terpisah; baris kosong diabaikan.

## Pengembangan lokal

```sh
npm install
npm run dev
```

Vite memproxy request `/api/*` ke API sekolah.

## Build produksi

```sh
npm run build
```
