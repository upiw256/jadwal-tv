import { useEffect, useState } from 'react';

const NEWS_URL = '/news.txt';
const DEFAULT_MESSAGE = 'Belum ada informasi terbaru.';

export function useNewsTicker() {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  useEffect(() => {
    let cancelled = false;
    const fetchNews = async () => {
      try {
        const response = await fetch(`${NEWS_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`File berita menjawab ${response.status}`);
        const text = await response.text();
        const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        if (!cancelled) setMessage(lines.length ? lines.join('  •  ') : DEFAULT_MESSAGE);
      } catch (error) {
        console.error('Gagal mengambil berita:', error);
      }
    };

    void fetchNews();
    const interval = window.setInterval(() => void fetchNews(), 2_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return message;
}
