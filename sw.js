// ═══════════════════════════════════════════════════════
// sw.js — Service Worker untuk Keuangan Jauhar & Nita
// HARUS di-host di root domain: https://yourdomain.com/sw.js
// Tidak bisa pakai blob URL — iOS butuh file asli
// ═══════════════════════════════════════════════════════

const CACHE_NAME = 'keuangan-jn-v2';
const ICON_URL = 'https://ik.imagekit.io/ljqggx4fn/nikah/nj%20png.png';

// Install — skip waiting agar langsung aktif
self.addEventListener('install', e => {
  self.skipWaiting();
});

// Activate — claim semua clients
self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// ═══ Handle Push dari server (untuk masa depan jika pakai VAPID) ═══
self.addEventListener('push', e => {
  let data = { title: 'Keuangan JN', body: 'Ada notifikasi baru' };
  try { if (e.data) data = e.data.json(); } catch(err) {}
  
  e.waitUntil(
    self.registration.showNotification(data.title || 'Keuangan JN', {
      body: data.body || '',
      icon: ICON_URL,
      badge: ICON_URL,
      tag: data.tag || 'keuangan-jn',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false
    })
  );
});

// ═══ Handle notif diklik — buka/fokus app ═══
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = (e.notification.data && e.notification.data.url) || '/';
  
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Cari window yang sudah terbuka
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          return;
        }
      }
      // Buka window baru jika belum ada
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ═══ Handle pesan dari main thread ═══
// Ini yang dipanggil saat kita post message dari app
self.addEventListener('message', e => {
  if (!e.data) return;
  
  if (e.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, data } = e.data;
    // showNotification dari SW ini yang bisa muncul di lockscreen iOS!
    self.registration.showNotification(title || 'Keuangan JN', {
      body: body || '',
      icon: ICON_URL,
      badge: ICON_URL,
      tag: tag || 'keuangan-jn-' + Date.now(),
      data: data || {},
      vibrate: [200, 100, 200],
      silent: false
    });
  }
  
  if (e.data.type === 'PING') {
    // Untuk test koneksi SW
    if (e.source) e.source.postMessage({ type: 'PONG' });
  }
});