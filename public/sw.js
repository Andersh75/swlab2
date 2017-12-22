self.addEventListener('install', function(event) {
    console.log('Service Worker installing.');
  });
  
  self.addEventListener('activate', function(event) {
    console.log('Service Worker activating.');  
  });

self.addEventListener('fetch', function (event) {

    if (event.request.url.endsWith("api/bears")) {
        console.log('Service Worker fetching API: ', event.request);

        switch(event.request.method) {
            case 'GET':
                getAllNetworkFirst(event, 'bears');
                break;
        }
      } else if (event.request.url.includes("api/bears")) {
        var requestURL = new URL(event.request.url);
        var objectId = requestURL.pathname.replace("/api/bears/", '');
        console.log('Service Worker fetching API for one bear: ', objectId);
        switch(event.request.method) {
            case 'DELETE':
                deleteOneLocalFirst(event, 'bears', objectId);
                break;
            case 'GET':
                getOneNetworkFirst(event, 'bears', objectId);
                break;
        }
      } else {
        console.log('Service Worker fetching: ', event.request.url);
        switch(event.request.method) {
            case 'GET':
                event.respondWith(
                    caches.open("cache-main").then(function(cache) {
                        return cache.match(event.request).then(function(cachedResponse) {
                            return cachedResponse || fetch(event.request).then(
                                function(networkResponse) {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                }
                            );
                        });
                    })
                );
                break;
        }
      }
  });







var openDatabase = function () {
    return new Promise(function (resolve, reject) {
        var openRequest = indexedDB.open('test', 3);

        openRequest.onupgradeneeded = function (e) {
            var thisDB = e.target.result;
            console.log("running onupgradeneeded");

            if (!thisDB.objectStoreNames.contains("bears")) {
                var notesOS = thisDB.createObjectStore("bears", {
                    keyPath: "_id"
                });
            }
        };

        openRequest.onsuccess = function (e) {
            console.log('running onsuccess', e.target.result);
            var db;
            db = e.target.result;
            resolve(db);
        };

        openRequest.onerror = function (e) {
            console.log('onerror');
            console.dir(e);
            reject("Database error");

        };
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


var getObject = function(objectStore, object) {
    return new Promise(function(resolve, reject) {
        var request = objectStore.get(object);
        request.onsuccess = function(event) {
            resolve(event.target.result);
        };
    });
};

var getObjectFromStore = function(storeName, objectId) {
    return new Promise(function(resolve, reject) {
        openDatabase()
        .then(function(db) {
            console.log('MYDB: ', db)
            return openObjectStore(db, storeName, "readwrite");
        })
        .then(function(objectStore) {
            return getObject(objectStore, objectId);
        })
        .then(function(requestObject) {
            resolve(requestObject);
        });
    });
};


var getAllObjects = function(objectStore) {
    return new Promise(function(resolve, reject) {
        var notesAr = [];
        objectStore.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                notesAr.push(cursor.value);
                cursor.continue();
            } else {
                resolve(notesAr);
            } 
        };
    });
};

var getAllObjectsFromStore = function(storeName) {
    return new Promise(function(resolve, reject) {
        openDatabase()
        .then(function(db) {
            console.log('MYDB: ', db)
            return openObjectStore(db, storeName, "readwrite");
        })
        .then(function(objectStore) {
            return getAllObjects(objectStore);
        })
        .then(function(objects) {
            resolve(objects);
        });
    });
};


var addObject = function(objectStore, object) {
    return new Promise(function(resolve, reject) {
        var request = objectStore.add(object);
        request.onsuccess = resolve(object);
    });
};


var addObjects = function(objectStore, objects) {
    return new Promise(function(resolve, reject) {
        
        Promise.all(objects.map(function(object) {
            return addObject(objectStore, object);
        })).then(function(resps) {
            console.log('promiseAll: ', resps);
            resolve(resps);
        });
    });
};


var deleteObject = function(objectStore, objectId) {
    return new Promise(function(resolve, reject) {
        var request = objectStore.delete(objectId);
        request.onsuccess = resolve(objectStore);
    });
};

var deleteObjectFromStore = function(storeName, objectId) {
    return new Promise(function(resolve, reject) {
        openDatabase()
        .then(function(db) {
            console.log('MYDB: ', db)
            return openObjectStore(db, storeName, "readwrite");
        })
        .then(function(objectStore) {
            return deleteObject(objectStore, objectId);
        }).then(function(objectStore) {
            resolve(objectStore);
        });
       
    });
};

var deleteAllObjects = function(objectStore) {
    return new Promise(function(resolve, reject) {
        var request = objectStore.clear();
        request.onsuccess = resolve(objectStore);
    });
};

var deleteAllObjectsFromStore = function(storeName) {
    return new Promise(function(resolve, reject) {
        openDatabase()
        .then(function(db) {
            console.log('MYDB: ', db)
            return openObjectStore(db, storeName, "readwrite");
        })
        .then(function(objectStore) {
            console.log('HERE');
            return deleteAllObjects(objectStore);
        }).then(function(objectStore) {
            resolve(objectStore);
        });
       
    });
};



var getAllNetworkFirst = function(event, storeName) {
    event.respondWith(
        fetch(event.request)
        .then((res) => { return res.json()})
        .then(function(networkResponse) {
            return deleteAllObjectsFromStore(storeName)
                    .then(function(objectStore) {
                        console.log('NR: ', networkResponse);
                        return addObjects(objectStore, networkResponse);
                    })
                    .then(function() {
                        return new Response(JSON.stringify(networkResponse), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
        })
        .catch(function() {
            return  getAllObjectsFromStore(storeName)
                    .then(function(objects) {
                        return new Response(JSON.stringify(objects), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
        }) 
    );
};


var getOneLocalFirst = function(event, storeName, objectId) {
    event.respondWith(
        getObjectFromStore(storeName, objectId)
        .then(function(object) {
            console.log('myOBJ: ', object);
            if (object) {
                return new Response(JSON.stringify(object), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                return fetch(event.request);
            }    
        })
    );
};

var getOneNetworkFirst = function(event, storeName, objectId) {
    event.respondWith(
        fetch(event.request).catch(function() {
            return getObjectFromStore(storeName, objectId)
                    .then(function(object) {
                        console.log('myOBJ: ', object);
                        return new Response(JSON.stringify(object), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                        
                    });
        }
        
    )
    );
};

var deleteOneLocalFirst = function(event, storeName, objectId) {
    event.respondWith(
        deleteObjectFromStore('bears', objectId)
        .then(function() {
            console.log('try to delete');
            return fetch(event.request);
        })                     
    );
};







// var addFetchToStore = function(storeName, items) {
//     return new Promise(function(resolve, reject) {
//         openDatabase().then(function(db) {
//             openObjectStore(db, storeName, "readwrite")
//             .then(function(objStore) {
//                 return clearObjectStore(objStore);
//             })
//             .then(function(objStore) {
//                 //clearObjectStore();
//                 console.log('OBJECTSTORE: ', objStore);
//                 Promise.all(items.map(function(item) {
//                     return addObject(objStore, item);
//                 })).then(function(resps) {
//                     console.log('promiseAll: ', resps);
//                     resolve(resps);
//                 });
//             });
//         });
//     });
// };



// var getData = function(storeName, id) {
//     return new Promise(function(resolve, reject) {
//         openDatabase().then(function(db) {
//             var objectStore = openObjectStore(db, storeName);
//             var notesAr = [];
//             objectStore.then(function(objStore) {
//                 if (!id) {
//                     console.log('no id');
//                     getObjects(objStore).then(function(request) {
//                         resolve(request);
//                     });
                    
//                 }  else {
//                     getObject(objStore, id).then(function(request) {
//                         resolve(request);
//                     }); 
//                 }
//             }); 
//         });
//     });
// };








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





// var fallbackResponse = [
//     { _id: '00000000', name: "Sune", __v: 0 },
//     { _id: '11111111', name: "Pelle", __v: 0 },
//     { _id: '33333333', name: "Stina", __v: 0 }
// ];

// var singleFallbackResponse = { _id: '5555555', name: "Kurt", __v: 0 };