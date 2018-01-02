'use strict';






document.addEventListener('DOMContentLoaded', function() {
    var remoteCouch = 'http://127.0.0.1:5984/kittens';

    new PouchDB('kittens')
    .info()
    .then(function () {
        return new PouchDB('kittens');
    })
    .then(function(db) {

        db.changes({
            since: 'now',
            conflicts: true,
            live: true,
            include_docs: true
            }).on('change', function (change) {
            console.log('change');
            console.log(change);
            }).on('error', function (err) {
            console.log('ERROR');
            });
        

        //db.sync(remoteCouch, { live: true, retry: true, conflicts: true});

        console.log(db);
        navigator.serviceWorker.ready.then(function(registration) {
            registration.sync.register('kittens').then(() => {
                console.log('Sync registered');
                //console.log('tags: ', registration.sync.getTags());
                console.log('SYNKED');
                
                fetchAll(db).then((countries) => displayList(countries, 'countries', db));
            });
        });
        

        document.getElementById('add-button').addEventListener('click', function () {
            addAndReload('countries', 'kittens', db);
        });



        function fetchAll(db) {
            //var el = document.getElementById(id);
              return db.allDocs({
                  include_docs: true,
                  attachments: true
              });  
        }
        
        
        function editAndReload(itemId, id, syncName, db) {
            editOne(itemId)
            .then((country) => {
                console.log(country);
                console.log(itemId);
                console.log(db);
                return editRecord(country, itemId, db);
            })
            // editRecord(itemId)
            //.then(() => fetchAll(db))
            //.then((countries) => displayList(countries, id, db))
            .then(() => {
                // db.replicate.from(remoteCouch).on('complete', function () {
                //     console.log('we are n sync');
                //     db.get(itemId, {conflicts: true}).then(function(doc) {
                //         console.log('HERE!!');
                //         console.log(doc);
                //         fetchAll(db).then((countries) => displayList(countries, 'countries', db));
                //     });
                //   });

                  db.sync(remoteCouch)
                  .then(function(item) {
                    console.log('ITEM');
                    console.log(item);

                  })
                  .then(function() {
                    db.get(itemId, {conflicts: true}).then(function(doc) {
                        console.log('HERE!!');
                        console.log(doc);
                        var el = helper.dom.getElement('id', 'conflicts');
                        el.innerHTML = '';
                        if (doc._conflicts) {
                            console.log(doc._conflicts);


                            //FIX SIMILAR IDS
                            
                                // let newDiv = helper.dom.createElement('div');
                                //     newDiv.innerHTML = '<div>' + doc.country + '</div><button data-rev="' + doc._rev + '" id="' + "rev-" + doc._id + '">Remove Conflict</button>';
                                //     newDiv.children[1].addEventListener('click', function (event) {
                                //         console.log(event.target);
                                //         db.remove(event.target.getAttribute('id').slice(4), event.target.getAttribute('data-rev'));
                                //     });

                                //     el.appendChild(newDiv);
                            doc['_conflicts'].forEach(element => {
                                
                                db.get(itemId, {rev: element}).then(function (doc) {
                                    
                                    //el.innerHTML = "jhgjhgjhg";
                                    let newDiv = helper.dom.createElement('div');
                                    newDiv.innerHTML = '<div>' + doc.country + '</div><button data-rev="' + doc._rev + '" id="' + "rev-" + doc._id + '">Remove Conflict</button>';
                                    newDiv.children[1].addEventListener('click', function (event) {
                                        console.log(event.target);
                                        db.remove(event.target.getAttribute('id').slice(4), event.target.getAttribute('data-rev'));
                                    });

                                    el.appendChild(newDiv);
                                    console.log(doc);
                                  }).catch(function (err) {
                                    // handle any errors
                                  });
                            });
                            
                        }
                        
                        fetchAll(db).then((countries) => displayList(countries, 'countries', db));
                    });
                  });
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
                console.log(doc);
                doc.country = item;
                return db.put(doc);
            }).catch(function(err) {
                console.log(err);
            });  
        }
        
        function deleteAndReload(itemId, id, syncName, db) {
            deleteOne(itemId, db)
            //.then(() => fetchAll(db))
            //.then((countries) => displayList(countries, id, db))
            .then(() => {
                db.sync(remoteCouch).on('complete', function () {
                    db.get(itemId, {conflicts: true}).then(function(doc) {
                        console.log('HERE!!');
                        console.log(doc);
                        fetchAll(db).then((countries) => displayList(countries, 'countries', db));
                    });
                  });
            });
        }
        
        
        function addAndReload(id, syncName, db) {
            console.log('db in addandreload');
            console.log(db);
            addOne()
            .then((country) => addRecord(country, db))
            //.then(() => fetchAll(db))
            //.then((countries) => displayList(countries, id, db))
            .then(() => {
                db.sync(remoteCouch).on('complete', function () {
                    console.log('we are n sync');
                    fetchAll(db).then((countries) => displayList(countries, 'countries', db));
                  });
            });
        }
        
        function deleteOne(item, db) {
            return db.get(item, {conflicts: true}).then(function(doc) {
                console.log(doc);
                return db.remove(doc);
            });  
        }
        
        
        function addRecord(item, db) {
            let doc = {
            _id: new Date().toISOString(),
            country: item
            };
            return db.put(doc);   
        }
        
        
        function addOne() {
            return new Promise(function(resolve, reject) {
                var el = document.getElementById('add-name');
                var country = el.value;
                if (country) {
                    el.value = '';
                    resolve(country);
                }
            });
        }
        
        /// SKA BARA GÖRA EN RAD I TAGET - ÄDRA ÄVEN FRÅN TABLE TILL DIV
        function displayList(countries, id, db) {
            console.log('db');
            console.log(db);
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
                        console.log('db in event listener');
                        console.log(db);
                        editAndReload(editField.getAttribute('id').slice(10), 'countries', 'kittens', db);
                    });
                
                
                    let deleteField = tblrow.children[2].children[0];
                    let deleteButton = tblrow.children[2].children[1];
                
                    deleteButton.addEventListener('click', function () {
                        deleteAndReload(deleteField.getAttribute('id').slice(12), 'countries', 'kittens', db);
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