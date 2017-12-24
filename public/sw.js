
// Här ska vi cacha all data
self.addEventListener('install', function(event) {
    console.log('Service Worker installing.');
  });
  

self.addEventListener('activate', function (event) {
    console.log('Service Worker activating.');
});



self.addEventListener('fetch', function (event) {
    let requestURL = new URL(event.request.url);
    let requestURLArray = requestURL.pathname.split('/');
    let requestMethod = event.request.method;


    if (requestURLArray[1] === 'api' && requestURLArray.length === 3) {
        //console.log('Service Worker fetching API: ', event.request);
        let storeName = requestURLArray[2];

        switch(requestMethod) {
            case 'GET':
                console.log('Get all...');
                getAllRecordsNetworkFirst(event, storeName);
                break;
            case 'POST':
            event.respondWith(
                postOneRecordLocal(event, storeName).then(function(recordId) {
                    return getOneRecordFromStore(storeName, recordId);
                }).then(function(record) {
                    console.log('Last record: ', record);
                    return fetch("/api/blog", {
                        method: 'POST',
                        body: JSON.stringify(record),
                        headers: {
                          'Content-Type': 'application/json',
                          'Accept': 'application/json'
                        }
                    });
                }).then(function(resp) {
                    console.log('RESP: ', resp);
                    return new Response(JSON.stringify({status: "OK"}), {
                                 headers: { 'Content-Type': 'application/json' }
                    });
                })
            );
                break;
        }
      } else if (requestURLArray[1] === 'api' && requestURLArray.length === 4) {
        let storeName = requestURLArray[2];
        let recordId = requestURLArray[3];
        //console.log('Service Worker fetching API for one bear: ', recordId);
        switch(requestMethod) {
            case 'DELETE':
                deleteOneRecordLocalFirst(event, storeName, recordId);
                break;
            case 'GET':
                console.log('Get one...');
                getOneRecordNetworkFirst(event, storeName, recordId);
                break;
            case 'PUT':
                event.respondWith(
                putOneRecordLocal(event, storeName, recordId)
                .then(function(record) {
                    console.log('Last record: ', record);
                    return fetch("/api/blog/" + recordId, {
                        method: 'PUT',
                        body: JSON.stringify(record),
                        headers: {
                          'Content-Type': 'application/json',
                          'Accept': 'application/json'
                        }
                    });
                }).then(function(resp) {
                    console.log('RESP: ', resp);
                    return new Response(JSON.stringify({status: "OK"}), {
                                 headers: { 'Content-Type': 'application/json' }
                    });
                })
            );
                break;
        }
      } else {
        //console.log('Service Worker fetching: ', event.request.url);
        switch(requestMethod) {
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







var indexedDBSettings = {
        dbInIndexedDB: {
            name: "test",
            version: 3
        },
        storesInIndexedDB: [
            {
                name: "bear",
                autoIncrement: false,
                inLineKeys: true,
                keyPath: "_id",
                index: []
            },
            {
                name: "inflation",
                autoIncrement: true,
                inLineKeys: true,
                keyPath: "_id",
                index: []
            },
            {
                name: "interest",
                autoIncrement: false,
                inLineKeys: false,
                //keyPath: "_id",
                index: []
            },
            {
                name: "blog",
                autoIncrement: true,
                inLineKeys: true,
                keyPath: "id",
                index: [
                    {
                        name: "author",
                        keyPath: "author",
                        unique: false
                    }
                ]
            }
        ]
};

/**
 * Open database, makes stores if needed
 */
var openDatabase = function () {
    return new Promise(function (resolve, reject) {
        let openRequest = indexedDB.open(indexedDBSettings.dbInIndexedDB.name, indexedDBSettings.dbInIndexedDB.version);

        openRequest.onupgradeneeded = function (e) {
            let thisDB = e.target.result;
            //console.log("running onupgradeneeded");

            indexedDBSettings.storesInIndexedDB.forEach(function(store) {
                if (!thisDB.objectStoreNames.contains(store.name)) {
                    if (store.inLineKeys) {
                        let recordStore = thisDB.createObjectStore(store.name, {
                            keyPath: store.keyPath,
                            autoIncrement: store.autoIncrement
                        });
                        store.index.forEach(function(index) {
                            recordStore.createIndex(index.name, index.keyPath, { unique: index.unique });
                        });
                        
                    } else {
                        let recordStore = thisDB.createObjectStore(store.name, {
                            autoIncrement: store.autoIncrement
                        });
                        store.index.forEach(function(index) {
                            recordStore.createIndex(index.name, index.keyPath, { unique: index.unique });
                        });
                    }
                    
                    
                }
            });
        };

        openRequest.onsuccess = function (e) {
            //console.log('running onsuccess', e.target.result);
            let db;
            db = e.target.result;
            resolve(db);
        };

        openRequest.onerror = function (e) {
            //console.log('onerror');
            //console.dir(e);
            reject("Database error");

        };
    });
};


/**
 * Resolves with one store object.
 * @param {*} db DB object
 * @param {*} storeName Store name
 * @param {*} transactionmode 
 */
var openRecordStore = function(db, storeName, transactionmode) {
    return new Promise(function(resolve, reject) {
        let recordStore = db
            .transaction(storeName, transactionmode)
            .objectStore(storeName);
        resolve(recordStore);
    });
};

/**
 * Resolves with one record object from store, using store object.
 * @param {*} recordStore Store object
 * @param {*} recordId Record ID
 */
var getRecord = function(recordStore, recordId) {
    return new Promise(function(resolve, reject) {
        let getRequest = recordStore.get(recordId);
        getRequest.onsuccess = function(event) {
            let record = event.target.result;
            resolve(record);
        };
    });
};


/**
 * Resolves with one record object from store, using store name.
 * @param {*} storeName Store name
 * @param {*} recordId Record ID
 */
var getOneRecordFromStore = function(storeName, recordId) {
    return new Promise(function(resolve, reject) {
        openDatabase()
        .then(function(db) {
            //console.log('MYDB: ', db);
            return openRecordStore(db, storeName, "readwrite");
        })
        .then(function(recordStore) {
            return getRecord(recordStore, recordId);
        })
        .then(function(record) {
            resolve(record);
        });
    });
};


/**
 * Resolves with one record object from store, using store name.
 * @param {*} storeName Store name
 * @param {*} recordId Record ID
 */
var getLastRecordFromStore = function(storeName) {
    return new Promise(function(resolve, reject) {
        openDatabase()
        .then(function(db) {
            //console.log('MYDB: ', db);
            return openRecordStore(db, storeName, "readwrite");
        })
        .then(function(recordStore) {

            recordStore.index('idNumber').openCursor(null, 'prev').onsuccess = function(event) {
                console.log('ETRV', event.target.result.value);
                resolve(event.target.result.value);
            };
            
        });
    });
};

/**
 * Resolves with all record objects from store, using store object.
 * @param {*} recordStore Store object
 */
var getAllRecords = function(recordStore) {
    return new Promise(function(resolve, reject) {
        recordStore.openCursor().onsuccess = function(event) {
            let records = [];
            let cursor = event.target.result;
            if (cursor) {
                records.push(cursor.value);
                cursor.continue();
            } else {
                resolve(records);
            } 
        };
    });
};


/**
 * Resolves with all record objects from store, using store name.
 * @param {*} storeName Store name
 */
var getAllRecordsFromStore = function(storeName) {
    return new Promise(function(resolve, reject) {
        openDatabase()
        .then(function(db) {
            //console.log('MYDB: ', db);
            return openRecordStore(db, storeName, "readwrite");
        })
        .then(function(recordStore) {
            return getAllRecords(recordStore);
        })
        .then(function(records) {
            resolve(records);
        });
    });
};

/**
 * Resolves with ..., using store object and record object.
 * @param {*} recordStore Store object
 * @param {*} record Record object
 */
var putRecord = function(recordStore, record, recordId) {
    return new Promise(function(resolve, reject) {
        console.log('WHAT???: ', record);
        record.id = Number(recordId);
        let putRequest = recordStore.put(record);
        console.log('Exists???: ', record);
        putRequest.onsuccess = resolve(record);
    });
};

/**
 * Resolves with store object, using store name and record object
 * @param {*} storeName 
 * @param {*} record 
 */
var putOneRecordToStore = function(storeName, record, recordId) {
    return new Promise(function(resolve, reject) {
        openDatabase()
        .then(function(db) {
            //console.log('MYDB: ', db);
            return openRecordStore(db, storeName, "readwrite");
        })
        .then(function(recordStore) {
            return putRecord(recordStore, record, recordId);
        }).then(function(record) {
            resolve(record);
        }); 
    });
};

/**
 * Put one record object to store name, using fetch event and store name. Local then network.
 * @param {*} event 
 * @param {*} storeName 
 */
var putOneRecordLocal = function(event, storeName, recordId) {
    return new Promise(function(resolve, reject) {
    var localRequest = event.request.clone();
        localRequest.json().then(function(record) {
            return putOneRecordToStore(storeName, record, recordId);
        }).then(function(record) {
            resolve(record);                
        });
     });
};

var postOneRecordLocal = function(event, storeName) {
    return new Promise(function(resolve, reject) {
    var localRequest = event.request.clone();
    
        localRequest.json().then(function(record) {
            return postOneRecordToStore(storeName, record);
        }).then(function(recordId) {
            console.log('recordID'. recordId)
            resolve(recordId);                
        });
    });
};

/**
 * Resolves with ..., using store object and record object.
 * @param {*} recordStore Store object
 * @param {*} record Record object
 */
var postRecord = function(recordStore, record) {
    return new Promise(function(resolve, reject) {
        console.log('WHAT???: ', record);
        let postRequest = recordStore.add(record);
        console.log('Exists???: ', record);
        postRequest.onsuccess = function(event) {
            resolve(event.target.result);
        };
    });
};

/**
 * Resolves with ..., using store object and record objects.
 * @param {*} recordStore Store object
 * @param {*} records Record objects
 */
var postRecords = function(recordStore, records) {
    console.log('record to add: ', records);
    return new Promise(function(resolve, reject) {
        Promise.all(records.map(function(record) {
            
            return postRecord(recordStore, record);
        })).then(function(resps) {
            console.log('promiseAll. WHAT IS THIS?: ', resps);
            resolve(resps);
        });
    });
};

/**
 * Add one record object to store name, using fetch event and store name. Local then network.
 * @param {*} event 
 * @param {*} storeName 
 */
var postOneRecordLocal = function(event, storeName) {
    return new Promise(function(resolve, reject) {
    var localRequest = event.request.clone();
    
        localRequest.json().then(function(record) {
            return postOneRecordToStore(storeName, record);
        }).then(function(recordId) {
            console.log('recordID'. recordId)
            resolve(recordId);                
        });
    });
};

/**
 * Resolves with store object, using store name and record object
 * @param {*} storeName 
 * @param {*} record 
 */
var postOneRecordToStore = function(storeName, record) {
    return new Promise(function(resolve, reject) {
        openDatabase()
        .then(function(db) {
            //console.log('MYDB: ', db);
            return openRecordStore(db, storeName, "readwrite");
        })
        .then(function(recordStore) {
            return postRecord(recordStore, record);
        }).then(function(recordId) {
            resolve(recordId);
        }); 
    });
};

/**
 * Resolves with store object, using store name and record ID
 * @param {*} storeName 
 * @param {*} recordId 
 */
var deleteOneRecordFromStore = function(storeName, recordId) {
    return new Promise(function(resolve, reject) {
        openDatabase()
        .then(function(db) {
            //console.log('MYDB: ', db);
            return openRecordStore(db, storeName, "readwrite");
        })
        .then(function(recordStore) {
            return deleteRecord(recordStore, recordId);
        }).then(function(recordStore) {
            resolve(recordStore);
        }); 
    });
};

/**
 * Resolves with ..., using store object and record ID.
 * @param {*} recordStore Store object
 * @param {*} recordId Record ID
 */
var deleteRecord = function(recordStore, recordId) {
    return new Promise(function(resolve, reject) {
        let deleteRequest = recordStore.delete(recordId);
        deleteRequest.onsuccess = resolve(recordStore);
    });
};

/**
 * Resolves with empty store object, using store object
 * @param {*} recordStore Store object
 */
var deleteAllRecords = function(recordStore) {
    return new Promise(function(resolve, reject) {
        let clearRequest = recordStore.clear();
        clearRequest.onsuccess = resolve(recordStore);
    });
};


/**
 * Resolves with empty store object, using store name
 * @param {*} storeName Store name
 */
var deleteAllRecordsFromStore = function(storeName) {
    return new Promise(function(resolve, reject) {
        openDatabase()
        .then(function(db) {
            //console.log('MYDB: ', db);
            return openRecordStore(db, storeName, "readwrite");
        })
        .then(function(recordStore) {
            //console.log('HERE');
            return deleteAllRecords(recordStore);
        }).then(function(recordStore) {
            resolve(recordStore);
        }); 
    });
};


/**
 * Fetch all record objects from store name, using fetch event and store name. Network first, fallback on local.
 * @param {*} event fetch event
 * @param {*} storeName Store name
 */
var getAllRecordsNetworkFirst = function(event, storeName) {
    event.respondWith(
        fetch(event.request)
        .then((res) => { return res.json();})
        .then(function(networkRecords) {
            return deleteAllRecordsFromStore(storeName)
                    .then(function(recordStore) {
                        console.log('NR: ', networkRecords);
                        return postRecords(recordStore, networkRecords);
                    })
                    .then(function() {
                        return new Response(JSON.stringify(networkRecords), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
        })
        .catch(function() {
            return  getAllRecordsFromStore(storeName)
                    .then(function(localRecords) {
                        return new Response(JSON.stringify(localRecords), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
        }) 
    );
};


/**
 * Fetch one record object from store name, using fetch event and store name. Local first, fallback on network.
 * @param {*} event 
 * @param {*} storeName 
 * @param {*} recordId 
 */
var getOneRecordLocalFirst = function(event, storeName, recordId) {
    event.respondWith(
        getOneRecordFromStore(storeName, recordId)
        .then(function(localRecord) {
            //console.log('myOBJ: ', localRecord);
            if (localRecord) {
                return new Response(JSON.stringify(localRecord), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                return fetch(event.request);
            }    
        })
    );
};


/**
 * Fetch one record object from store name, using fetch event and store name. Network first, fallback on local.
 * @param {*} event 
 * @param {*} storeName 
 * @param {*} recordId 
 */
var getOneRecordNetworkFirst = function(event, storeName, recordId) {
    event.respondWith(
        fetch(event.request).catch(function() {
            return getOneRecordFromStore(storeName, recordId)
                    .then(function(localRecord) {
                       console.log('My localRecord: ', localRecord);
                        return new Response(JSON.stringify(localRecord), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                        
                    });
        }  
    )
    );
};



/**
 * Delete one record object from store name, using fetch event and store name. Local first, fallback on network.
 * @param {*} event 
 * @param {*} storeName 
 * @param {*} recordId 
 */
var deleteOneRecordLocalFirst = function(event, storeName, recordId) {
    event.respondWith(
        deleteOneRecordFromStore(storeName, recordId)
        .then(function() {
            //console.log('try to delete');
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