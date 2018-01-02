

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

  