// Service worker Meja Trader. Naikkan VERSION setiap kali index.html diubah.
const VERSION='meja-trader-v1';
const CORE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png','./favicon.png'];
const CDN=['fonts.googleapis.com','fonts.gstatic.com','www.gstatic.com'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  // Jangan sentuh Firestore / Auth: biar SDK Firebase yang mengatur sinkron dan offline
  if(u.hostname.endsWith('googleapis.com')&&u.hostname!=='fonts.googleapis.com')return;
  // Halaman utama: ambil dari jaringan dulu, cadangan dari cache saat offline
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(VERSION).then(x=>x.put('./index.html',c));return res}).catch(()=>caches.match('./index.html')));
    return;
  }
  // File statis & CDN (font, SDK Firebase): pakai cache, perbarui di belakang layar
  if(u.origin===location.origin||CDN.includes(u.hostname)){
    e.respondWith(caches.match(r).then(hit=>{
      const net=fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const c=res.clone();caches.open(VERSION).then(x=>x.put(r,c))}return res}).catch(()=>hit);
      return hit||net;
    }));
  }
});
