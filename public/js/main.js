'use strict';






document.addEventListener('DOMContentLoaded', function() {

    var log = [];
    var remoteCouch = 'http://127.0.0.1:5984/kittens';

    new PouchDB('kittens')
    .info()
    .then(function () {
        return new PouchDB('kittens');
    })
    .then(function(db) {

        // db.changes({
        //     since: 'now',
        //     conflicts: true,
        //     live: true,
        //     include_docs: true
        //     }).on('change', function (change) {
        //     console.log('change');
        //     console.log(change);
        //     }).on('error', function (err) {
        //     console.log('ERROR');
        //     });
        

        db.sync(remoteCouch, { live: true, retry: true, conflicts: true, include_docs: true})
        .on('change', function (info) {
            //console.log(new Date().toISOString());
            //console.log(info);
            info.syncTime = new Date().toISOString();
            log.push(info);

            if ((info.direction == "pull") && (info.change.docs.length < 2)) {
                console.log("Normal pull");
            }

             else if ((info.direction == "pull") && (info.change.docs.length > 1)) {
                console.log("Bulk pull");
            }

            else if ((info.direction == "push") && (info.change.docs.length < 2)) {
                console.log("Normal push");
            }

            else if ((info.direction == "push") && (info.change.docs.length > 1)) {
                console.log("Bulk push");
            }   
            else {
                console.log('NOT ANY OF THE PUSH AND PULLS');
            console.log(log);
            }
           // if(info)
            fetchAll(db).then((countries) => displayList(countries, 'countries', db));
          }).on('paused', function (info) {
        //     //console.log(new Date().toISOString());
                console.log('PAUSED');
          }).on('active', function () {
            console.log('ACTIVE');
            // replicate resumed (e.g. new changes replicating, user went back online)
          }).on('denied', function (err) {
            console.log('DENIED');
            // a document failed to replicate (e.g. due to permissions)
          }).on('complete', function (info) {
            console.log('COMPLETE');
            // handle complete
          }).on('error', function (err) {
            console.log('ERROR');
            // handle error
          });

        fetchAll(db)
        .then((countries) => displayList(countries, 'countries', db))
        .then(() => db.sync(remoteCouch, { conflicts: true, include_docs: true}))
        .then(function() {
            console.log('sy');
            fetchAll(db).then((countries) => displayList(countries, 'countries', db));
        });

        // console.log(db);
        // navigator.serviceWorker.ready.then(function(registration) {
        //     registration.sync.register('kittens').then(() => {
        //         console.log('Sync registered');
        //         //console.log('tags: ', registration.sync.getTags());
        //         console.log('SYNKED');
                
                
        //     });
        // });
        
        

        document.getElementById('add-button').addEventListener('click', function () {
            addAndReload('countries', db);
        });



                
        function addAndReload(domId, db) {
            // console.log('db in addandreload');
            // console.log(db);
            getValueFromField('add-name')
            .then((value) => addRecord(value, db))
            // .then(() => fetchAll(db))
            // .then((records) => displayList(records, domId, db))
            // .then(() => {
            //     db.sync(remoteCouch, {conflicts: true, include_docs: true}).on('complete', function (item) {
            //         console.log(item);
            //         console.log('we are n sync');
            //         fetchAll(db).then((records) => displayList(records, 'countries', db));
            //       });
            // })
            .catch(function() {
                console.log('error');
            });
        }

        function addRecord(value, db) {
            return new Promise(function(resolve, reject) {
                let doc = {
                    _id: new Date().toISOString(),
                    written: new Date().toISOString(),
                    country: value
                    };
                resolve(db.put(doc));   
            });      
        }
        
        
        function getValueFromField(domId) {
            return new Promise(function(resolve, reject) {
                var el = document.getElementById(domId);
                var value = el.value;
                if (value) {
                    el.value = '';
                    resolve(value);
                }
            });
        }






        function fetchAll(db) {
            //var el = document.getElementById(id);
              return db.allDocs({
                  include_docs: true,
                  attachments: true
              });  
        }
        
        
        function editAndReload(itemId, id, db) {
            editOne(itemId)
            .then((country) => {
                return editRecord(country, itemId, db);
            })
            .then(() => fetchAll(db))
            .then((countries) => displayList(countries, id, db))
            .then(() => {
                  db.sync(remoteCouch, {conflicts: true, include_docs: true})
                  .then(function(item) {
                    console.log('ITEM');
                    console.log(item);
                  })
                  .then(function() {
                    db.allDocs({conflicts: true, include_docs: true}).then(function(doc) {
                        console.log('HERE!!');
                        console.log(doc);
                        return conflictSolver(doc)
                        .then((conflictObj) => chooseWinner(conflictObj))
                        .then(() => fetchAll(db))
                        .then((countries) => displayList(countries, 'countries', db));
                    });
                  });
            });
        }



        function isEmpty(obj) {
            for(var prop in obj) {
                if(obj.hasOwnProperty(prop))
                    return false;
            }
        
            return true;
        }



        function chooseWinner(conflictObj) {
            return new Promise(function (resolve, reject) {

                if (!isEmpty(conflictObj)) {
                    var el = helper.dom.getElement('id', 'conflicts');
                    el.innerHTML = '';
        
                    let wrapperDiv = helper.dom.createElement('div');
                    let lableDiv = helper.dom.createElement('div');
                    let newButton = helper.dom.createElement('button');
        
        
                    helper.dom.setAttribute('data-rev', conflictObj.winner.rev, newButton);
                    helper.dom.setAttribute('data-id', conflictObj.winner.id, newButton);

                    newButton.addEventListener('click', function (event) {
                        console.log(event.target);
                        el.innerHTML = '';
                        db.remove(event.target.getAttribute('data-id'), event.target.getAttribute('data-rev')).then(function() {
                            fetchAll(db).then((countries) => displayList(countries, 'countries', db));
                        });
                    });

                    helper.dom.appendInnerHTMLIO('Remove: ' + conflictObj.winner.name, newButton);

                    helper.dom.appendInnerHTMLIO('WINNER', lableDiv);

                    helper.dom.appendChildNodeIO(lableDiv, wrapperDiv);
                    helper.dom.appendChildNodeIO(newButton, wrapperDiv);
                    helper.dom.appendChildNodeIO(wrapperDiv, el);

                    wrapperDiv = helper.dom.createElement('div');
                    lableDiv = helper.dom.createElement('div');
                    helper.dom.appendInnerHTMLIO('LOOSERS', lableDiv);
                    helper.dom.appendChildNodeIO(lableDiv, wrapperDiv);

                    console.log(conflictObj.loosers);

                    console.log(conflictObj.loosers[0].rev);


                    Promise.all(conflictObj.loosers.map(function(item) {
                        return new Promise(function(resolve, reject) {
                            console.log('in loosers');
                            console.log(item);
                            let newButton = helper.dom.createElement('button');
                
                            helper.dom.setAttribute('data-rev', item.rev, newButton);
    
                            helper.dom.setAttribute('data-id', conflictObj.winner.id, newButton);
    
                            newButton.addEventListener('click', function (event) {
                                console.log(event.target);
                                el.innerHTML = '';
                                db.remove(event.target.getAttribute('data-id'), event.target.getAttribute('data-rev')).then(function() {
                                    fetchAll(db).then((countries) => displayList(countries, 'countries', db));
                                });
                            });
    
                            helper.dom.appendInnerHTMLIO('Remove: ' + item.name, newButton);
    
                            helper.dom.appendChildNodeIO(newButton, wrapperDiv);


                            resolve();

                            
                        });
                        


                        
                        

                    })).then(function() {
                        helper.dom.appendChildNodeIO(wrapperDiv, el);
                        console.log('object NOT empty');
                        resolve();
                    });

                    



                }


                if (isEmpty(conflictObj)) {
                    console.log('object empty');
                    resolve();
                }
                





                
            });
            
        }
        




        function conflictSolver(doc) {
            return new Promise(function (resolve, reject) {
                
                let conflictObj = {};
                if (doc._conflicts) {
                    console.log(doc._conflicts);

                    

                    conflictObj.id = doc._id;
                    conflictObj.winner = {
                        id: doc._id,
                        name: doc.country,
                        rev: doc._rev
                    };
                    conflictObj.loosers = [];

                    console.log(conflictObj);


                    //FIX SIMILAR IDS
                    
                        // 
                        //     newDiv.innerHTML = '<div>' + doc.country + '</div><button data-rev="' + doc._rev + '" id="' + "rev-" + doc._id + '">Remove Conflict</button>';
                        //     newDiv.children[1].addEventListener('click', function (event) {
                        //         console.log(event.target);
                        //         db.remove(event.target.getAttribute('id').slice(4), event.target.getAttribute('data-rev'));
                        //     });

                        //     el.appendChild(newDiv);

                        Promise.all(doc['_conflicts'].map(function(element) {
                            return new Promise(function (resolve, reject) {
                                db.get(doc._id, {rev: element}).then(function (docItem) {
                                    let tempObj = {};
                                    tempObj.id = docItem._id;
                                    tempObj.name = docItem.country;
                                    tempObj.rev = docItem._rev;

                                    console.log('tempObj');
                                    console.log(tempObj);


                                    resolve(tempObj);
        
                                    //conflictObj.loosers.push(tempObj);
        
                                    //console.log(conflictObj.loosers);
                                    
                        
                                    // let newDiv = helper.dom.createElement('div');
        
                                    // newDiv.innerHTML = docItem._rev;
                                    // //newDiv.innerHTML = '<div>' + doc.country + '</div><button data-rev="' + docItem._rev + '" data-id="' + "rev-" + docItem._id + '">Remove Conflict</button>';
                                    // // newDiv.children[1].addEventListener('click', function (event) {
                                    // //     console.log(event.target);
                                    // //     db.remove(event.target.getAttribute('data-id').slice(4), event.target.getAttribute('data-rev'));
                                    // // });
        
                                    // el.appendChild(newDiv);
                                    // console.log(docItem);
                                    
                                }).catch(function (err) {
                                    console.log('in the catch');
                                });

                            });
                        })).then(function(loosersAr) {
                            console.log('loosersAr');
                            console.log(loosersAr);
                            conflictObj.loosers = loosersAr;
                            resolve(conflictObj);
                        });
  
                } else {
                    resolve(conflictObj);
                }


                
            });
        }



        
















        function editOne(itemId) {
            console.log('ID', itemId);
            return new Promise(function(resolve, reject) {
                var el = document.getElementById('editField-' + itemId);
                var country = el.value;
                if (country) {
                    el.value = '';
                    resolve(country);
                }
            })
        }
        
        function editRecord(item, itemId, db) {
            return db.get(itemId, {conflicts: true}).then(function(doc) {
                //console.log(doc);
                doc.country = item;
                doc.written = new Date().toISOString();
                return db.put(doc);
            }).catch(function(err) {
                console.log(err);
            });  
        }
        
        function deleteAndReload(itemId, id, db) {
            deleteOne(itemId, db)

            .then((result) => {
                console.log('RESULT');
                console.log(result);
                fetchAll(db)
                .then((countries) => displayList(countries, id, db))
                .then(() => db.sync(remoteCouch, {conflicts: true, include_docs: true}))
                .then(function(item) {
                  console.log('ITEM');
                  console.log(item);
                })
                .then(function() {
                  db.get(itemId, {rev: result.rev, conflicts: true}).then(function(doc) {
                      console.log('HERE!!');
                      console.log(doc);
                      return conflictSolver(doc)
                      .then((conflictObj) => chooseWinner(conflictObj))
                      .then(() => fetchAll(db))
                      .then((countries) => displayList(countries, 'countries', db));
                  });
                });
          });
        }



        

        
        function deleteOne(item, db) {
            return db.get(item).then(function (doc) {
                doc._deleted = true;
                doc.written = new Date().toISOString();
                return db.put(doc);
                });
            
        }
        
        

        
        /// SKA BARA GÖRA EN RAD I TAGET - ÄDRA ÄVEN FRÅN TABLE TILL DIV
        function displayList(countries, id, db) {
            // console.log('db');
            // console.log(db);
            //var el = document.getElementById(id);
            var el = helper.dom.getElement('id', id);
        
            let data = '';
            el.innerHTML = data;
            if (countries.rows.length > 0) {
                for (var i = 0; i < countries.rows.length; i++) {
                    let data = '';
        
                    data += '<td>' + countries.rows[i].doc.country + '</td>';
                    data += '<td><input type="text" id="' + "editField-" + countries.rows[i].doc._id + '"><button id="' + "editButton-" + countries.rows[i].doc._id + '">Edit</button></td>';
                    data += '<td><input type="text" id="' + "deleteField-" + countries.rows[i].doc._id + '"><button id="' + "deleteButton-" + countries.rows[i].doc._id + '">Delete</button></td>';
                
                    let tblrow = helper.dom.createElement('tr');
                    tblrow.innerHTML = data;
                    //el.innerHTML += data;
        
                    let editField = tblrow.children[1].children[0];
                    let editButton = tblrow.children[1].children[1];
                
                    editButton.addEventListener('click', function () {
                        //console.log('db in event listener');
                        //console.log(db);
                        editAndReload(editField.getAttribute('id').slice(10), 'countries', db);
                    });
                
                
                    let deleteField = tblrow.children[2].children[0];
                    let deleteButton = tblrow.children[2].children[1];
                
                    deleteButton.addEventListener('click', function () {
                        deleteAndReload(deleteField.getAttribute('id').slice(12), 'countries', db);
                    });
                
                    //console.log(tblrow.children[0].children[1].children[0].getAttribute('id'));
                
                    el.appendChild(tblrow);
                }
            }
        
            
            return el;
        }






    });


    


    

    
    

    
    
    
    
    
    
    























    document.getElementById("first").innerHTML = '<h1>Paragraph changed!</h1>';
    console.log("YO!!!!");

    // fetch('/images/testimage.jpg')
	// .then(function(response) {
    //     console.log("hej!!!!");
	//   return response.blob();
	// })
	// .then(function(imageBlob) {
    //     document.getElementById("second").src = URL.createObjectURL(imageBlob);
    // });

    var bearEntry = document.createElement("input");
    bearEntry.setAttribute('type', 'text');
    bearEntry.setAttribute('value', 'default');
    bearEntry.setAttribute('id', 'bearinput');


    document.getElementById('first').appendChild(bearEntry);

    var bearButton = document.createElement("button");
    bearButton.setAttribute("type", "submit");

    bearButton.addEventListener('click', function() {
        
        
        console.log(document.getElementById('bearinput').value);

        var payload = {
            author: document.getElementById('bearinput').value
        };

          fetch("/api/blog", {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }).then((res) => {
            console.log('resp in main');
             return res.json()})
            //  .then((data) => {
            //      return new Promise(function(resolve, reject) {
            //         console.log('data: ',data);
            //         navigator.serviceWorker.ready.then(function(registration) {
            //             registration.sync.register("message-queue-sync");
            //           });
            //     resolve(data);
            //      });
                 
            //     })
        .then((data) => {
            document.getElementById('sixth').innerHTML = JSON.stringify(data);
            })
            .catch(function (e) {
                document.getElementById('sixth').innerHTML = e;
            });


            navigator.serviceWorker.ready.then(function(registration) {
                registration.sync.register('/blog/post/waiting').then(() => {
                    console.log('Sync registered');
                    console.log('tags: ', registration.sync.getTags());
                });
            });
    });

    document.getElementById('first').appendChild(bearButton);




    var deleteEntry = document.createElement("input");
    deleteEntry.setAttribute('type', 'text');
    deleteEntry.setAttribute('value', 'default');
    deleteEntry.setAttribute('id', 'deleteinput');


    document.getElementById('delete').appendChild(deleteEntry);

    var deleteButton = document.createElement("button");
    deleteButton.setAttribute("type", "submit");

    deleteButton.addEventListener('click', function() {
        console.log(document.getElementById('deleteinput').value);

        var payload = {
            id: document.getElementById('deleteinput').value
        };

          fetch("/api/blog/" + payload.id, {
            method: 'DELETE',
            //body: JSON.stringify(payload),
            // headers: {
            //   'Content-Type': 'application/json',
            //   'Accept': 'application/json'
            // }
          }).then((res) => {
            console.log('res');
             return res.json()})
        .then((data) => {
            document.getElementById('seventh').innerHTML = JSON.stringify(data);
            }).catch(function (e) {
                document.getElementById('seventh').innerHTML = e;
            });
    });

    document.getElementById('delete').appendChild(deleteButton);








    
    var elem = document.createElement("img");

    elem.src = '/images/testimage.jpg';

    document.getElementById("second").appendChild(elem);

    // fetch('http://localhost:4000/api/bea/5a3c4134b5f523b1617c60ed')
    // .then((res) => { return res.json()})
    // .then((data) => { 
    //     document.getElementById('third').innerHTML = JSON.stringify(data);
    //     }).catch(function (e) {
    //         document.getElementById('third').innerHTML = e;
    //     });


        fetch('http://localhost:4000/api/interest/1')
    .then((res) => {
        console.log('res');
         return res.json()})
    .then((data) => {
        document.getElementById('fourth').innerHTML = JSON.stringify(data);
        }).catch(function (e) {
            document.getElementById('fourth').innerHTML = e;
        });

        fetch('http://localhost:4000/api/blog')
        .then((res) => { return res.json()})
        .then((data) => { 
            document.getElementById('fifth').innerHTML = JSON.stringify(data);
            }).catch(function (e) {
                document.getElementById('fifth').innerHTML = e;
            });



}, false);






            //     navigator.serviceWorker.ready.then(function(registration) {
            //         registration.sync.register(syncName).then(() => {
            //             console.log('Sync registered');
            //             //console.log('tags: ', registration.sync.getTags());
            //             console.log('SYNKED');
            //             fetchAll(db).then((countries) => displayList(countries, 'countries', db));
            //         });
            //     });