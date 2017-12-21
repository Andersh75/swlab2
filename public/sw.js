self.addEventListener('install', function(event) {
    console.log('Service Worker installing.');
  });
  
  self.addEventListener('activate', function(event) {
    console.log('Service Worker activating.');  
  });

self.addEventListener('fetch', function (event) {

    var fallbackResponse = [
        { _id: '00000000', name: "Sune", __v: 0 },
        { _id: '11111111', name: "Pelle", __v: 0 },
        { _id: '33333333', name: "Stina", __v: 0 }
    ];

    var singleFallbackResponse = { _id: '5555555', name: "Kurt", __v: 0 };


    if (event.request.url.endsWith("api/bears")) {
        console.log('Service Worker fetching API: ', event.request);
        event.respondWith(
            fetch(event.request)
            .then((res) => { return res.json()})
            .then(
                function(networkResponse) {
                    return addFetchToStore("bears", networkResponse);
                }).then(function(resp) {
                    //console.log(resp);
                    return new Response(JSON.stringify(resp), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            )
            .catch(function() {
                //console.log(resp);

                return getData('bears').then(function(obj) {

                    return new Response(JSON.stringify(obj), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            );
            })
        
    );


        // event.respondWith(
        //     addFetchToStore("bears", fallbackResponse)
        //     .then(function(resps) {
        //         //console.log('response array!!: ', resps);
        //         return new Response(JSON.stringify(resps), {
        //             headers: { 'Content-Type': 'application/json' }
        //         });
        //     })
        // );



        // event.respondWith(
        //     new Response(JSON.stringify(fallbackResponse), {
        //         headers: { 'Content-Type': 'application/json' }
        //     })
        // );
          

        
        

      } else if (event.request.url.includes("api/bears")) {
          var requestURL = new URL(event.request.url);
          var ourPath = requestURL.pathname;
          var ourID = ourPath.replace("/api/bears/", '');

        console.log('Service Worker fetching API for one bear: ', ourID);
        event.respondWith(
            getData('bears', ourID).then(function(obj) {
                    if (obj) {
                        return new Response(JSON.stringify(obj), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } else {
                        return fetch(event.request);
                    }
                    
                }
            )
        );


        // event.respondWith(
        //     addFetchToStore("bears", fallbackResponse)
        //     .then(function(resps) {
        //         //console.log('response array!!: ', resps);
        //         return new Response(JSON.stringify(resps), {
        //             headers: { 'Content-Type': 'application/json' }
        //         });
        //     })
        // );



        // event.respondWith(
        //     new Response(JSON.stringify(fallbackResponse), {
        //         headers: { 'Content-Type': 'application/json' }
        //     })
        // );
          

        
        

      } else {
      console.log('Service Worker fetching: ', event.request.url);

      event.respondWith(
          caches.open("cache-main").then(function(cache) {
              return cache.match(event.request).then(function(cachedResponse) {
                  return cachedResponse || fetch(event.request).then(
                      function(networkResponse) {
                          cache.put(event.request, networkResponse.clone());
                          return networkResponse;
                      });
              });
          })
      )}
  });


  var openDatabase = function() {
    return new Promise(function(resolve, reject) {
        var openRequest = indexedDB.open('test', 3);

        openRequest.onupgradeneeded = function(e) {
            var thisDB = e.target.result;
            console.log("running onupgradeneeded");
    
            if (!thisDB.objectStoreNames.contains("bears")) {
                var notesOS = thisDB.createObjectStore("bears", {keyPath: "_id"});
            }
        };
    
        openRequest.onsuccess = function(e) {
            console.log('running onsuccess', e.target.result);
            var db;
            db = e.target.result;
            resolve(db);
            //addNote();
        };
    
        openRequest.onerror = function(e) {
            console.log('onerror');
            console.dir(e);
            reject("Database error");
            
        };
    });
    

};


var addFetchToStore = function(storeName, items) {
    return new Promise(function(resolve, reject) {
        openDatabase().then(function(db) {
            openObjectStore(db, storeName, "readwrite")
            .then(function(objStore) {
                return clearObjectStore(objStore);
            })
            .then(function(objStore) {
                //clearObjectStore();
                console.log('OBJECTSTORE: ', objStore);
                Promise.all(items.map(function(item) {
                    return addObject(objStore, item);
                })).then(function(resps) {
                    console.log('promiseAll: ', resps);
                    resolve(resps);
                });
            });
        });
    });

};

var openObjectStore = function(db, storeName, transactionmode) {
    return new Promise(function(resolve, reject) {
        var objectStore = db
            .transaction(storeName, transactionmode)
            .objectStore(storeName);
        resolve(objectStore);
    });
};



var addObject = function(objectStore, object) {
    return new Promise(function(resolve, reject) {
        var request = objectStore.add(object);
        request.onsuccess = resolve(object);
    });
};

var clearObjectStore = function(objectStore) {
    return new Promise(function(resolve, reject) {
        var request = objectStore.clear();
        request.onsuccess = resolve(objectStore);
    });
};

// // fetch('http://localhost:4000/api/bears').then((res) => { return res.json()}).then(function(data) {
// //     data.forEach(function(dataItem) {
// //         openDatabase().then(function(db) {
// //             console.log('then');
// //             console.log(dataItem);
// //             return openObjectStore(db, "notes", "readwrite");
// //         }).then(function(objectStore) {
// //             console.log('myObjectStore');
// //             return addObject(objectStore, dataItem);
// //         });
// //     });
    
// // });


var getData = function(storeName, id) {
    return new Promise(function(resolve, reject) {
        openDatabase().then(function(db) {
            var objectStore = openObjectStore(db, storeName);
            var notesAr = [];
            objectStore.then(function(objStore) {
                if (!id) {
                    console.log('no id');
                    objStore.openCursor().onsuccess = function(event) {
                        var cursor = event.target.result;
                        if (cursor) {
                            notesAr.push(cursor.value);
                            cursor.continue();
                        } else {
                            resolve(notesAr);
                        } 

                    }

                }  else {
                    var request = objStore.get(id);
                    request.onsuccess = function(event) {
                        console.log('What I found', event.target.result);
                        resolve(event.target.result);
                    };
                   

                    
                }
            }); 
        });
    });
};



// var getData = function() {
//     return new Promise(function(resolve, reject) {
//         openDatabase().then(function(db) {
//             var objectStore = openObjectStore(db, 'notes');
//             var notesAr = [];
//             objectStore.then(function(objStore) {
//                 objStore.openCursor().onsuccess = function(event) {
//                 var cursor = event.target.result;
//                 if (cursor) {
//                     notesAr.push(cursor.value);
//                     cursor.continue();
//                 } else {
//                     if (notesAr.length > 0) {
//                         resolve(notesAr);
//                     } else {
//                         fetch('http://localhost:4000/api/bears').then((res) => { return res.json()}).then(function(data) {
//                             return Promise.all(data.map(function(dataItem) {
//                                 openDatabase().then(function(db) {
//                                     console.log('then');
//                                     console.log(dataItem);
//                                     return openObjectStore(db, "notes", "readwrite");
//                                 }).then(function(objectStore) {
//                                     console.log('myObjectStore');
//                                     return addObject(objectStore, dataItem);
//                                 });
//                             }));
                            
//                         });
//                     }
//                 }
//             }; 
//         });
//     });
//     });
// };






// function addNote() {
//     var newNote = 'mynote';
//         console.log("About to add "+ newNote);

//     var transaction = db.transaction(["notes"],"readwrite");
//     var store = transaction.objectStore("notes");

//     var note = { text: newNote,
//     created:new Date().getTime() 
//     };

//     var request = store.add(note);
//     request.onerror = function(e) { 
//         console.log("Error",e.target.error.name);
//     };

//     request.onsuccess = function(e) { 
//         console.log("Woot! Did it");
//     };
// }




// getData().then(function(dataAr) {
//     console.log('getData', dataAr);
// });
