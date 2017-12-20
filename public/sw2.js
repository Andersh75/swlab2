self.addEventListener('install', function(event) {
    console.log('Service Worker installing.');
  });
  
  self.addEventListener('activate', function(event) {
    console.log('Service Worker activating.');  
  });

  self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request).catch(function() {
            return new Response(
                'my string',
                {headers: {"Content-Type": "text/plain"}}
            );
        })
    ); 
  });

  