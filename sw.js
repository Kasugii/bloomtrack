// ✿ BloomTrack Service Worker v2
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Store reminders in memory (persists while SW is alive)
const reminders = {};

self.addEventListener('message', event => {
  const data = event.data;
  if(!data) return;

  if(data.type === 'scheduleReminder'){
    // Cancel existing timer for this note
    if(reminders[data.id]){
      clearTimeout(reminders[data.id]);
      delete reminders[data.id];
    }
    const delay = new Date(data.fireAt).getTime() - Date.now();
    if(delay <= 0 || delay > 7*24*60*60*1000) return;
    reminders[data.id] = setTimeout(()=>{
      delete reminders[data.id];
      self.registration.showNotification(data.title||'BloomTrack ✿',{
        body: data.body||'Tu as un rappel !',
        icon: '/bloomtrack/assets/icon.png',
        badge: '/bloomtrack/assets/icon.png',
        tag: 'bt-'+data.id,
        requireInteraction: true,
        vibrate: [200,100,200]
      });
    }, delay);
  }

  if(data.type === 'cancelReminder'){
    if(reminders[data.id]){ clearTimeout(reminders[data.id]); delete reminders[data.id]; }
  }

  if(data.type === 'cancelAll'){
    Object.keys(reminders).forEach(id=>{ clearTimeout(reminders[id]); delete reminders[id]; });
  }

  // Ping to keep SW alive
  if(data.type === 'ping'){
    event.source?.postMessage({type:'pong'});
  }
});

// Click on notification → focus/open tab
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{
      for(const c of clients){
        if(c.url.includes('bloomtrack')) return c.focus();
      }
      return self.clients.openWindow('https://kasugii.github.io/bloomtrack/');
    })
  );
});
