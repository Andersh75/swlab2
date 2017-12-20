self.addEventListener('install', function(event) {
    console.log('Service Worker installing.');
  });
  
  self.addEventListener('activate', function(event) {
    console.log('Service Worker activating.');  
  });

  self.addEventListener('fetch', function(event) {
      console.log('Service Worker fetching: ', event.request.url);
      event.respondWith(
          caches.open("cache-main").then(function(cache) {
              return cache.match(event.request).then(function(cachedResponse) {
                  return cachedResponse || fetch(event.request).then(
                      function(networkResponse) {
                          cache.put(event.request, networkResponse.clone());
                          return networkResponse;
                      });
              })
          })
      )
  });