// Service worker di TaskEase: pagina "sei offline" e notifiche push.
// Le pagine dell'app non si salvano: contengono dati personali e devono essere sempre aggiornate.
const CACHE = 'taskease-v1'
const OFFLINE = '/offline.html'
const STATICI = [OFFLINE, '/icona-192.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATICI)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

// Solo le navigazioni: se la rete manca, mostra la pagina offline
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return
  e.respondWith(fetch(e.request).catch(() => caches.match(OFFLINE)))
})

self.addEventListener('push', (e) => {
  let dati = { titolo: 'TaskEase', testo: 'Hai una novità.', link: '/notifiche' }
  try {
    dati = { ...dati, ...e.data.json() }
  } catch {}
  e.waitUntil(
    self.registration.showNotification(dati.titolo, {
      body: dati.testo,
      icon: '/icona-192.png',
      badge: '/icona-192.png',
      data: { link: dati.link },
      lang: 'it',
    }),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const link = (e.notification.data && e.notification.data.link) || '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((finestre) => {
      for (const f of finestre) {
        if ('focus' in f) {
          f.navigate(link)
          return f.focus()
        }
      }
      return self.clients.openWindow(link)
    }),
  )
})
