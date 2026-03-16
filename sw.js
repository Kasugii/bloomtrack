// ✿ BloomTrack Service Worker — notifications en arrière-plan
const VERSION = 'bloomtrack-sw-v1';
const pendingTimers = {};

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Réception de messages depuis la page
self.addEventListener('message', event => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'scheduleReminder') {
    // Annuler si déjà planifié pour cet id
    if (pendingTimers[data.id]) {
      clearTimeout(pendingTimers[data.id]);
      delete pendingTimers[data.id];
    }
    const now = Date.now();
    const fireAt = new Date(data.fireAt).getTime();
    const delay = fireAt - now;
    if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) return; // max 7 jours
    pendingTimers[data.id] = setTimeout(() => {
      delete pendingTimers[data.id];
      self.registration.showNotification(data.title || 'BloomTrack ✿', {
        body: data.body || 'Tu as un rappel !',
        icon: data.icon || '/assets/icon.png',
        badge: data.icon || '/assets/icon.png',
        tag: 'bloomtrack-' + data.id,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        data: { url: self.location.origin }
      });
    }, delay);
  }

  if (data.type === 'cancelReminder') {
    if (pendingTimers[data.id]) {
      clearTimeout(pendingTimers[data.id]);
      delete pendingTimers[data.id];
    }
  }

  if (data.type === 'cancelAll') {
    Object.keys(pendingTimers).forEach(id => {
      clearTimeout(pendingTimers[id]);
      delete pendingTimers[id];
    });
  }
});

// Clic sur la notification → ouvrir/focuser l'onglet BloomTrack
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      return self.clients.openWindow(self.location.origin);
    })
  );
});
