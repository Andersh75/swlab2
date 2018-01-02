var helper = {};
(function() {


    // Map, Reduce, Filter
    this.map = my.curry(function(callback, array) {
        var newArray = [];
        for (var i = 0; i < array.length; i = i + 1) {
            newArray[i] = callback(array[i], i);
        }
        return newArray;
    });

    this.reduce = my.curry(function(callback, initialValue, array) {
        var working = initialValue;
        //console.log('array:', typeof(initialValue));
        for (var i = 0; i < array.length; i = i + 1) {
            working = callback(working, array[i]);
            //console.log('working: ', working);
        }
        return working;
    });





    //Booleans
    this.isEven = my.curry(function(x) {
        return (x % 2 === 0);
    });


    //Strings
    this.str = {
        adder: my.curry(function(acc, nextString) {
        return acc + nextString;
        }),
        startsWith: my.curry(function(str, test) {
            return str.substring(0,2) === test;
        }),
        removeFirstWordsFromString: my.curry(function(str, count) {
            return str.split(" ").slice(count).join(" ");
        }),
        getFirstWordsFromString: my.curry(function(str, count) {
            return str.split(" ").slice(0, count).join(" ");
        })
    };


    //Arrays
    this.arr = {
        flatten: my.curry(function(arr) {
            return arr.reduce(function (flat, toFlatten) {
              return flat.concat(Array.isArray(toFlatten) ? helper.arr.flatten(toFlatten) : toFlatten);
            }, []);
          })
    };


    //Events
    this.events = (function(){
        var topics = {};
        var hOP = topics.hasOwnProperty;
      
        return {
          subscribe: function(topic, listener) {
            // Create the topic's object if not yet created
            if(!hOP.call(topics, topic)) topics[topic] = [];
      
            // Add the listener to queue
            var index = topics[topic].push(listener) -1;
      
            // Provide handle back for removal of topic
            return {
              remove: function() {
                delete topics[topic][index];
              }
            };
          },
          publish: function(topic, info) {
            // If the topic doesn't exist, or there's no listeners in queue, just leave
            if(!hOP.call(topics, topic)) return;
      
            // Cycle through topics queue, fire!
            topics[topic].forEach(function(item) {
                    item(info != undefined ? info : {});
            });
          }
        };
    })();
    
    
    //Requests
    this.requestPostJson = my.curry(function(baseString, requestString, data) {
            return new Promise((resolve, reject) => {
                var request = new XMLHttpRequest();
                request.open('POST', baseString + requestString, true);
                console.log(baseString + requestString);
                console.log(JSON.stringify(data));
                request.setRequestHeader('Content-type', 'application/json');
                request.send(JSON.stringify(data));
                request.onreadystatechange = function () {
                    if (request.readyState === 4 && request.status === 200) {
                        resolve(request.response);
                    }
                };
            })
        });

        


    this.requestGetJson = my.curry(function(baseString, requestString) {
        return new Promise((resolve, reject) => {
            var request = new XMLHttpRequest();
            request.open('GET', baseString + requestString);
            request.responseType = 'application/json';
            request.send();
            console.log('here...');
            request.onreadystatechange = function () {
                console.log(baseString + requestString);
                console.log(request.readyState);
                console.log(request.status);
                if (request.readyState === 4 && request.status === 200) {
                    console.log(request.response);
                    resolve(JSON.parse(request.response));
                    
                }
                if (request.readyState === 4 && request.status !== 200) {
                    console.log(request.response);
                    //throw 'Uh-oh! rejected message';
                    reject('meddelande');
                    
                }
            };
        })
    });


    this.indexedDB = {
        openDb: my.curry(function (db_name, db_version, storeAndIndex) {
            console.log("openDb ...");
        
            var openRequest = indexedDB.open(db_name,db_version);
            
            openRequest.onupgradeneeded = function(e) {
                var thisDB = e.target.result; 
                console.log("running onupgradeneeded");
        
                storeAndIndex.forEach(function(item) {
                    if(!thisDB.objectStoreNames.contains(item.OS)) {
                        let itemOS = thisDB.createObjectStore(item.OS, {keyPath: "id"});
        
                        item.indices.forEach(function(info) {
                            itemOS.createIndex(info.index, info.name, {unique:info.unique});
                        }) 
                    }
        
                });
            
                
            };
            openRequest.onsuccess = function(e) {
                console.log("running onsuccess");
                db = e.target.result;
                helper.events.publish('reloadedPage', '5091');
            };
            
            openRequest.onerror = function(e) {
                console.log("onerror!");
                console.dir(e);
            };
        }),
        getObjectStore: my.curry(function (store_name, mode) {
            var tx = db.transaction(store_name, mode);
            return tx.objectStore(store_name);
        }),
        getAllInStore: my.curry(function (store_name) {
            return new Promise((resolve, reject) => {
                let store = helper.indexedDB.getObjectStore(store_name, 'readonly');
                let request;
                let arr = [];
            
                request = store.openCursor();
                request.onsuccess = function(event) {
                    let cursor = event.target.result;
            
                    if (cursor) {
                        log(cursor.value);
                        arr.push(cursor.value);
                        cursor.continue();
    
                    } else {
                        console.log("No more entries");
                        if(arr.length != 0) {
                            resolve(arr);
                        } else {
                            reject();
                        };
                        
                    }
                };

                request.onerror = function(event) {
                    reject();
                };
                
            });      
            
        }),
        getOneFromIndexInStore: my.curry(function (store_name, index_name, index_value) {
            return new Promise((resolve, reject) => {
        
                let store = helper.indexedDB.getObjectStore(store_name, 'readonly');
                let index = store.index(index_name);
                let request;
            
                request = index.get(index_value);
                request.onsuccess = function(event) {
                    log(event.target.result);
                    resolve(event.target.result);
                };
            });
        }),
        getAllFromIndexInStore: my.curry(function (store_name, index_name, index_value) {
            return new Promise((resolve, reject) => {
                console.log('store_name: ', store_name);
                console.log('index_name: ', index_name);
                console.log('index_value: ', index_value);
                let singleKeyRange = IDBKeyRange.only(index_value);
                let store = helper.indexedDB.getObjectStore(store_name, 'readonly');
                let index = store.index(index_name);
                let request;
                let arr = [];
            
                request = index.openCursor(singleKeyRange);
                request.onsuccess = function(event) {
                    let cursor = event.target.result;
            
                    if (cursor) {
                        log(cursor.value);
                        arr.push(cursor.value);
                        console.log('cursor: ', arr);
                        cursor.continue();
                    } else {
                        console.log("No more entries", index_name);
                        console.log(arr);
                        if (arr.length) {
                            console.log('arr.length');
                            resolve(arr);
                        } else {
                            console.log('arr.length == 0');
                            reject(); 
                        }
                        
                    }
                };

                request.onerror = function(event) {
                    console.log('An error!');
                    reject();
                };
            });
        }),
        deleteOneFromKeyInStore: my.curry(function (store_name, key) {
            
            
            let store = helper.indexedDB.getObjectStore(store_name, 'readwrite');
            let request = store.delete(key);
            
            request.onsuccess = function(e) {
                log('deleted one');
                console.dir(e);
            }
        
            request.onerror = function(e) {
                console.log("Error");
                console.dir(e);
            }
        }),
        addObjectToStore: my.curry(function (store_name, obj) {
            //console.log("addPublication arguments:", obj);
        
            var store = helper.indexedDB.getObjectStore(store_name, 'readwrite');
            var req;
            try {
              req = store.add(obj);
            } catch (e) {
              if (e.name == 'DataCloneError') {
                console.log(e.name);
              }
                
              throw e;
            }
            req.onsuccess = function (event) {
              console.log("Insertion in DB successful");
            };
            req.onerror = function() {
              //console.error("addPublication error", this.error);
            };
        }),
        getOneFromKeyInStore: my.curry(function (store_name, key) {
            
            
                let store = helper.indexedDB.getObjectStore(store_name, 'readonly');
                let request = store.get(key);
                
                request.onsuccess = function(e) {
                    log('get one');
                    var result = e.target.result;
                    console.dir(result);
                }
            
                request.onerror = function(e) {
                    console.log("Error");
                    console.dir(e);
                }
            })
    };

    

    

    //DOM
    this.dom = {

        appendInnerHTMLIO: my.curry(function(inner, el) {
            el.innerHTML = inner;
            return el;
        }),
        appendInnerHTMLOI: my.curry(function(el, inner) {
            el.innerHTML = inner;
            return el;
        }),
        appendChildNodeIO: my.curry(function(child, el) {
            el.appendChild(child);
            return el;
        }),
        appendChildNodeOI: my.curry(function(el, child) {
            el.appendChild(child);
            return el;
        }),
        appendSiblingNodeCS: my.curry(function(el, sibling) {
            el.insertAdjacentElement('afterend',sibling);
            return el;
        }),
        check: my.curry(function(el) {
            el.checked = true;
            return el;
        }),
        createElement: my.curry(function(tag) {
            return document.createElement(tag);
        }),
        getElement: my.curry(function(kind, name) {
            switch(kind) {
                case 'id':
                    return document.getElementById(name);
                    break;
                case 'class':
                    return document.getElementsByClassName(name);
                    break;
            }   
        }),
        removeChildrenUntil: my.curry(function(el, numb) {
            while (el.children.length > numb) {
            el.removeChild(el.lastChild);
            }
        }),
        setAttribute: my.curry(function(attribute, name, el) {
            el.setAttribute(attribute, name);
            return el;
        }),
        uncheck: my.curry(function(el) {
            el.checked = false;
            return el;
        }),
        wrapTag: my.curry(function(tag, str) {
            return '<' + tag + '>' + str + '</' + tag + '>';
        }) 
    };


    




}).apply(helper);    












//Set
Set.prototype.isSuperset = function(subset) {
    for (var elem of subset) {
        if (!this.has(elem)) {
            return false;
        }
    }
    return true;
}

Set.prototype.union = function(setB) {
    var union = new Set(this);
    for (var elem of setB) {
        union.add(elem);
    }
    return union;
}

Set.prototype.intersection = function(setB) {
    var intersection = new Set();
    for (var elem of setB) {
        if (this.has(elem)) {
            intersection.add(elem);
        }
    }
    return intersection;
}

Set.prototype.difference = function(setB) {
    var difference = new Set(this);
    for (var elem of setB) {
        difference.delete(elem);
    }
    return difference;
}

