
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
        let fetchPath = '/' + requestURLArray[1] + '/' + requestURLArray[2];

        switch(requestMethod) {
            case 'GET':
                console.log('Get all...');
                //getAllRecordsNetwork(event, fetchPath);
                //getAllRecordsLocal(event, storeName);
                //getAllRecordsNetworkFirstAndReplace(event, storeName, fetchPath);
                getAllRecordsNetworkFirst(event, storeName, fetchPath);
                //getAllRecordsLocalFirst(event, storeName, fetchPath);

                break;
            // case 'POST':
            //     postOneRecordLocalThenNetwork(event, storeName, requestMethod, fetchPath);
            //     break;
        }
      } else if (requestURLArray[1] === 'api' && requestURLArray.length === 4) {
        let storeName = requestURLArray[2];
        let recordId = requestURLArray[3];
        let fetchPath = '/' + requestURLArray[1] + '/' + requestURLArray[2] + '/' + requestURLArray[3];
        //console.log('Service Worker fetching API for one bear: ', recordId);
        switch(requestMethod) {
            // case 'DELETE':
            //     deleteOneRecordLocalFirst(event, storeName, recordId);
            //     break;
            case 'GET':
                console.log('Get one...');
                //getOneRecordNetwork(event);
                //getOneRecordLocal(event, storeName, recordId);
                //getOneRecordNetworkFirst(event, storeName, recordId);
                getOneRecordLocalFirst(event, storeName, recordId);


                break;
            // case 'PUT':
                
            //     break;
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



var fetchBody = function(requestMethod, record, type) {
    return {
        method: requestMethod,
        body: JSON.stringify(record),
        headers: {
          'Content-Type': 'application/' + type,
          'Accept': 'application/' + type
        }
    };
};


var responseOK = function() {
    return new Promise(function(resolve, reject) {
        resolve(new Response(JSON.stringify({status: "OK"}), {
            headers: { 'Content-Type': 'application/json' }
        }));
    });
};






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
 * Resolves with ..., using store object and record ID.
 * @param {*} recordStore Store object
 * @param {*} recordId Record ID
 */
var deleteOneRecord = function(recordStore, recordId) {
    return new Promise(function(resolve, reject) {
        let deleteRequest = recordStore.delete(recordId);
        deleteRequest.onsuccess =  function(event) {
            let recordId = event.target.result;
            console.log('deleteRecord RECORDID: ', recordId);
            resolve(recordId);
        };
    });
};

/**
 * Resolves with one record object from store, using store object.
 * @param {*} recordStore Store object
 * @param {*} recordId Record ID
 */
var getOneRecord = function(recordStore, recordId) {
    return new Promise(function(resolve, reject) {
        let getRequest = recordStore.get(recordId);
        getRequest.onsuccess = function(event) {
            let record = event.target.result;
            console.log('getRecord RECORD: ', getRequest);
            resolve(record);
        };
    });
};

/**
 * Resolves with recordId using store object and record object.
 * @param {*} recordStore Store object
 * @param {*} record Record object
 */
var postOneRecord = function(recordStore, record) {
    return new Promise(function(resolve, reject) {
        console.log('WHAT???: ', record);
        let postRequest = recordStore.add(record);
        console.log('Exists???: ', record);
        postRequest.onsuccess = function(event) {
            let recordId = event.target.result;
            console.log('postRecord RECORDID: ', recordId);
            resolve(recordId);
        };
    });
};


/**
 * Resolves with recordId using store object and record object.
 * @param {*} recordStore Store object
 * @param {*} record Record object
 */
var putOneRecord = function(recordStore, record, recordId) {
    return new Promise(function(resolve, reject) {
        console.log('WHAT???: ', record);
        record.id = Number(recordId);
        let putRequest = recordStore.put(record);
        console.log('Exists???: ', record);
        putRequest.onsuccess = function(event) {
            let recordId = event.target.result;
            console.log('putRecord RECORDID: ', recordId);
            resolve(recordId);
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
            return postOneRecord(recordStore, record);
        })).then(function(recordIds) {
            console.log('postRecords RECORDIDS: ', recordIds);
            resolve(recordIds);
        });
    });
};



/**
 * Resolves with empty store object, using store object
 * @param {*} recordStore Store object
 */
var deleteAllRecords = function(recordStore) {
    return new Promise(function(resolve, reject) {
        let clearRequest = recordStore.clear();
        clearRequest.onsuccess = function(event) {
            console.log('deleteAllRecords store: ', recordStore);
            resolve(recordStore);
        };
    });
};

/**
 * Resolves with all record objects from store, using store object.
 * @param {*} recordStore Store object
 */
var getAllRecords = function(recordStore) {
    return new Promise(function(resolve, reject) {
        var records = [];
        recordStore.openCursor().onsuccess = function(event) {
            
            var cursor = event.target.result;
            if (cursor) {
                //console.log(cursor.value);
                //console.log(records);
                records.push(cursor.value);
                cursor.continue();
            } else {
                //console.log('in getallrecords: ', records);
                resolve(records);
            } 
        };
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
            return deleteOneRecord(recordStore, recordId);
        }).then(function(recordId) {
            console.log('deleteOneRecordFromStore RECORDID: ', recordId);
            resolve(recordId);
        }); 
    });
};

/**
 * Resolves with store object, using store name and record ID
 * @param {*} storeName 
 * @param {*} recordId 
 */
var getOneRecordFromStore = function(storeName, recordId) {
    return new Promise(function(resolve, reject) {
        openDatabase()
        .then(function(db) {
            //console.log('MYDB: ', db);
            return openRecordStore(db, storeName, "readwrite");
        })
        .then(function(recordStore) {
            return getOneRecord(recordStore, recordId);
        }).then(function(record) {
            console.log('getOneRecordFromStore RECORD: ', record);
            resolve(record);
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
            return postOneRecord(recordStore, record);
        }).then(function(recordId) {
            console.log('postOneRecordToStore RECORDID: ', recordId);
            resolve(recordId);
        }); 
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
            return putOneRecord(recordStore, record, recordId);
        }).then(function(recordId) {
            console.log('putOneRecordToStore RECORDID: ', recordId);
            resolve(recordId);
        }); 
    });
};

var deleteOneRecordFromRemoteDB = function(record, fetchPath, requestMethod) {
    return fetch(fetchPath, fetchBody(requestMethod, record, 'json'));
};


var postOneRecordToRemoteDB = function(record, fetchPath, requestMethod) {
    return fetch(fetchPath, fetchBody(requestMethod, record, 'json'));
};

var putOneRecordFromRemoteDB = function(record, fetchPath, requestMethod) {
    return fetch(fetchPath, fetchBody(requestMethod, record, 'json'));
};
var getOneRecordFromRemoteDB = function(event) {
    return fetch(event.request);
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
 * Resolves with empty store object, using store name
 * @param {*} storeName Store name
 */
var getAllRecordsFromStore = function(storeName) {
    return new Promise(function(resolve, reject) {
        openDatabase()
        .then(function(db) {
            console.log('MYDB: ', db);
            return openRecordStore(db, storeName, "readwrite");
        })
        .then(function(recordStore) {
            console.log('HERE', recordStore);
            return getAllRecords(recordStore);
        }).then(function(records) {
            console.log(records);
            resolve(records);
        }); 
    });
};


var getAllRecordsFromRemoteDB = function(fetchPath) {
        return fetch(fetchPath);
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
 * Resolves with one record object from store, using store name.
 * @param {*} storeName Store name
 * @param {*} recordId Record ID
 */
var deleteOneRecordLocal = function(storeName, recordId) {
    event.respondWith(
        deleteOneRecordFromStore(storeName, recordId).then(function(recordId) {
            return new Response(JSON.stringify({"recordId": recordId}), {
                headers: { 'Content-Type': 'application/json' }
            });
        })
    );
};


/**
 * Resolves with one record object from store, using store name.
 * @param {*} storeName Store name
 * @param {*} recordId Record ID
 */
var getOneRecordLocal = function(event, storeName, recordId) {
    event.respondWith(
        getOneRecordFromStore(storeName, recordId).then(function(record) {
            return new Response(JSON.stringify(record), {
                headers: { 'Content-Type': 'application/json' }
            });
        })
    );
};


/**
 * Add one record object to store name, using fetch event and store name. Local then network.
 * @param {*} event 
 * @param {*} storeName 
 */
var postOneRecordLocal = function(event, storeName) {
    return new Promise(function(resolve, reject) {
        event.request.json().then(function(record) {
            return postOneRecordToStore(storeName, record);
        }).then(function(recordId) {
            return new Response(JSON.stringify({"recordId": recordId}), {
                headers: { 'Content-Type': 'application/json' }
            });
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
        event.request.json().then(function(record) {
            return putOneRecordToStore(storeName, record, recordId);
        }).then(function(recordId) {
            return new Response(JSON.stringify({"recordId": recordId}), {
                headers: { 'Content-Type': 'application/json' }
            });
        })
     });
};


/**
 * Resolves with one record object from store, using store name.
 * @param {*} storeName Store name
 * @param {*} recordId Record ID
 */
var getOneRecordNetwork = function(event) {
    event.respondWith(
        getOneRecordFromRemoteDB(event).catch(function() {
            return new Response(JSON.stringify({"recordId": 'ONE'}), {
                headers: { 'Content-Type': 'application/json' }
            });
        })
    );
};



/**
 * Resolves with one record object from store, using store name.
 * @param {*} storeName Store name
 * @param {*} recordId Record ID
 */
var deleteAllRecordsLocal = function(storeName) {
    event.respondWith(
        deleteAllRecordsFromStore(storeName).then(function(recordIds) {
            return new Response(JSON.stringify({"recordIds": records}), {
                headers: { 'Content-Type': 'application/json' }
            });
        })
    );
};

/**
 * Resolves with one record object from store, using store name.
 * @param {*} storeName Store name
 * @param {*} recordId Record ID
 */
var getAllRecordsLocal = function(event, storeName) {
    event.respondWith(
        getAllRecordsFromStore(storeName).then(function(records) {
            return new Response(JSON.stringify(records), {
                headers: { 'Content-Type': 'application/json' }
            });
        })
    );
};

/**
 * Resolves with one record object from store, using store name.
 * @param {*} storeName Store name
 * @param {*} recordId Record ID
 */
var getAllRecordsNetwork = function(event, fetchPath) {
    event.respondWith(
        getAllRecordsFromRemoteDB(fetchPath).catch(function() {
            return new Response(JSON.stringify({"recordId": 'ALL'}), {
                headers: { 'Content-Type': 'application/json' }
            });
        })
    );
};



var postOneRecordLocalThenNetwork = function(event, storeName, requestMethod, fetchPath) {
    event.respondWith(
            event.request.json().then(function(record) {
                return postOneRecordToStore(storeName, record);
            }).then(function(recordId) {
                return getOneRecordFromStore(storeName, recordId);
            }).then(function(record) {
                console.log('Last record: ', record);
                return postOneRecordNetwork(record, fetchPath, requestMethod);
            }).then(function(networkResponse) {
                console.log('RESP!: ', networkResponse);
                return responseOK();
            }).catch(function() {
                console.log('ERROR');
            })
    );
};
        


var putOneRecordLocalThenNetwork = function(event, storeName, requestMethod, fetchPath) {
    event.respondWith(
        putOneRecordLocal(event, storeName, recordId).then(function(recordId) {
            return getOneRecordLocal(storeName, recordId);
        }).then(function(record) {
            console.log('Last record: ', record);
            return putOneRecordFromRemoteDB(record, fetchPath, requestMethod);
        }).then(function(networkResponse) {
            console.log('RESP!: ', networkResponse);
            return responseOK();
        }).catch(function() {
            console.log('ERROR');
        })
    );
};






/**
 * Delete one record object from store name, using fetch event and store name. Local first, fallback on network.
 * @param {*} event 
 * @param {*} storeName 
 * @param {*} recordId 
 */
var deleteOneRecordLocalFirst = function(event, storeName, recordId, fetchPath, record, requestMethod) {
    event.respondWith(
        deleteOneRecordFromStore(storeName, recordId).then(function(recordId) {
            return new Response(JSON.stringify({"recordId": recordId}), {
                headers: { 'Content-Type': 'application/json' }
            });
        })
        .catch(function() {
            return deleteOneRecordFromRemoteDB(record, fetchPath, requestMethod);
        })                     
    );
};


/**
 * Fetch one record object from store name, using fetch event and store name. Local first, fallback on network.
 * @param {*} event 
 * @param {*} storeName 
 * @param {*} recordId 
 */
var getOneRecordLocalFirst = function(event, storeName, recordId, fetchPath, record, requestMethod) {
    event.respondWith(
        getOneRecordFromStore(storeName, recordId).then(function(record) {
            return new Response(JSON.stringify(record), {
                headers: { 'Content-Type': 'application/json' }
            });
        })
        .catch(function() {
            return getOneRecordFromRemoteDB(record, fetchPath, requestMethod).catch(function() {
                return new Response(JSON.stringify({"recordId": 'ONE'}), {
                    headers: { 'Content-Type': 'application/json' }
                });
            });
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
    console.log('in the...');
    event.respondWith(
        getOneRecordFromRemoteDB(event)
        .catch(function() {
            console.log('in the catch');
            return getOneRecordFromStore(storeName, recordId).then(function(record) {
                return new Response(JSON.stringify(record), {
                    headers: { 'Content-Type': 'application/json' }
                });
                }).catch(function() {
                return new Response(JSON.stringify({"recordId": 'ONE'}), {
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
var getAllRecordsLocalFirst = function(event, storeName, fetchPath) {
    event.respondWith(
        getAllRecordsFromStore(storeName).then(function(records) {
            return new Response(JSON.stringify(records), {
                headers: { 'Content-Type': 'application/json' }
            });
        })
        .catch(function() {
            return getAllRecordsFromRemoteDB(fetchPath);
        })    
    );
};

/**
 * Fetch all record objects from store name, using fetch event and store name. Network first, fallback on local.
 * @param {*} event fetch event
 * @param {*} storeName Store name
 */
var getAllRecordsNetworkFirst = function(event, storeName, fetchPath) {
    event.respondWith(
        getAllRecordsFromRemoteDB(fetchPath).catch(function() {
            return getAllRecordsFromStore(storeName).then(function(localRecords) {
                return new Response(JSON.stringify(localRecords), {
                    headers: { 'Content-Type': 'application/json' }
                });
            });
        })    
    );
};


/**
 * Fetch all record objects from store name, using fetch event and store name. Network first, fallback on local.
 * @param {*} event fetch event
 * @param {*} storeName Store name
 */
var getAllRecordsNetworkFirstAndReplace = function(event, storeName, fetchPath) {
    event.respondWith(
        getAllRecordsFromRemoteDB(fetchPath)
        .then(function(networkResponse) {
            console.log('NR#', networkResponse);
            return networkResponse.json();
        }).then(function(networkRecords) {
            return deleteAllRecordsFromStore(storeName)
                    .then(function(recordStore) {
                        return postRecords(recordStore, networkRecords);
                    })
                    .then(function() {
                        return new Response(JSON.stringify(networkRecords), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
        
        })
        .catch(function() {
            console.log('from local');
            return getAllRecordsFromStore(storeName).then(function(localRecords) {
                return new Response(JSON.stringify(localRecords), {
                    headers: { 'Content-Type': 'application/json' }
                });
            });
        })    
    );
};




/**
 * Fetch all record objects from store name, using fetch event and store name. Network first, fallback on local.
 * @param {*} event fetch event
 * @param {*} storeName Store name
 */
// var getAllRecordsNetworkFirst = function(event, storeName) {
//     event.respondWith(
//         fetch(event.request)
//         .then((res) => { return res.json();})
//         .then(function(networkRecords) {
//             return deleteAllRecordsFromStore(storeName)
//                     .then(function(recordStore) {
//                         console.log('NR: ', networkRecords);
//                         return postRecords(recordStore, networkRecords);
//                     })
//                     .then(function() {
//                         return new Response(JSON.stringify(networkRecords), {
//                             headers: { 'Content-Type': 'application/json' }
//                         });
//                     });
//         })
//         .catch(function() {
//             return  getAllRecordsFromStore(storeName)
//                     .then(function(localRecords) {
//                         return new Response(JSON.stringify(localRecords), {
//                             headers: { 'Content-Type': 'application/json' }
//                         });
//                     });
//         }) 
//     );
// };





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