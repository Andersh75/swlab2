'use strict';






document.addEventListener('DOMContentLoaded', function() {


    var manualUpdateOnNormalPull = true;
    var manualUpdateOnBulkPull = true;

    var log = [];
    var remoteCouch = 'http://127.0.0.1:5984/kittens';

    new PouchDB('kittens')
    .info()
    .then(function () {
        return new PouchDB('kittens');
    })
    .then(function(db) {
        
        db.sync(remoteCouch, { live: true, retry: true, conflicts: true, include_docs: true})
        .on('change', function (info) {
            
            info.syncTime = new Date().toISOString();
            log.push(info);


            if ((info.direction == "pull") && (info.change.docs.length < 2)) {
                console.log("Normal pull");
                console.log(info);
                if (manualUpdateOnNormalPull) {
                    ChoosePulledOrExistingRev(info.change.docs[0])
                    .then(() => fetchAllAndUpdate()); 
                } else {

                }      
            }

             else if ((info.direction == "pull") && (info.change.docs.length > 1)) {
                console.log("Bulk pull");
                if (manualUpdateOnBulkPull) {
                    Promise.all(info.change.docs.map((doc) => ChoosePulledOrExistingRev(doc)))
                    .then(() => fetchAllAndUpdate()); 
                } else {

                }
            }

            else if ((info.direction == "push") && (info.change.docs.length < 2)) {
                console.log("Normal push");
                console.log(info);
            }

            else if ((info.direction == "push") && (info.change.docs.length > 1)) {
                console.log("Bulk push");
                console.log(info);

            }   
            else {
                console.log('NOT ANY OF THE PUSH AND PULLS');
            }


            function ChoosePulledOrExistingRev(latestDocRev) {
                return new Promise(function(resolve, reject) {
                    if (confirm("Do you want these? " + latestDocRev.country) == true) {
                        resolve(); 
                    } else {
                        useExistingRev(latestDocRev)
                        .then(() => {
                            resolve();
                        });
                    }
                });
                
            }


            //Done
            function useExistingRev(latestDocRev) {
                return getPreviousRev(latestDocRev)
                .then((previousDocRev) => {
                    if (typeof latestDocRev._revisions === 'undefined') {
                        latestDocRev._deleted = true;
                    } else {
                        latestDocRev._deleted = previousDocRev._deleted;
                        latestDocRev.country = previousDocRev.country;
                    }
                    return db.put(latestDocRev);
                });
            }


            //Done
            function getPreviousRev(latestDocRev) {
                let previousRev;
                let id = latestDocRev._id;

                if (typeof latestDocRev._revisions === 'undefined') {
                    previousRev = latestDocRev._rev;
                } else {
                    previousRev = (latestDocRev._revisions.ids.length - 1) + '-' + latestDocRev._revisions.ids[1];   
                }
                return db.get(id, {rev: previousRev, include_docs: true});
            }


            //Done
            function fetchAllAndUpdate() {
                fetchAll(db)
                .then((docs) => displayList(docs, 'countries', db));
            }














            function displayConflicts(conflictingObjs) {
                console.log(conflictingObjs[0][0].conflict.name);
                
                let el = helper.dom.getElement('id', 'conflicts');

                helper.dom.appendInnerHTMLIO('', el);


                


                conflictingObjs.forEach(function(conflictingObj) {
                    let newInput = helper.dom.createElement('input');
                        helper.dom.setAttribute('type', 'radio', newInput);

                        newInput.addEventListener('click', function() {
                            console.log(conflictingObj[0].winner.rev);
                            Promise.all(conflictingObj.map(function(arrayEl) {
                                //return new Promise(function (resolve, reject) {
                                    return db.remove(conflictingObj[0].docId, arrayEl.conflict.rev);
                                }))
                                .then(function() {
                                    console.log('DONE');
                                    helper.dom.appendInnerHTMLIO('', el);
                                });
                            
                        });
                        helper.dom.appendChildNodeIO(newInput, el);
                        
                        let newBold = helper.dom.createElement('b');
                        helper.dom.appendInnerHTMLIO('Keep: ' + conflictingObjs[0][0].winner.name, newBold);
                        helper.dom.appendChildNodeIO(newBold, el);



                    conflictingObj.forEach(function(item) {
                        let newInput = helper.dom.createElement('input');
                        helper.dom.setAttribute('type', 'radio', newInput);
                        
                        newInput.addEventListener('click', function() {
                            console.log(item.conflict.rev);
                            Promise.all(conflictingObj.filter(function(element) {
                                    return element.conflict.rev != item.conflict.rev;
                                }).map(function(arrayEl) {
                                    //return new Promise(function (resolve, reject) {
                                        return db.remove(conflictingObj[0].docId, arrayEl.conflict.rev);
                                    }))
                                    .then(function() {
                                        return db.remove(conflictingObj[0].docId, conflictingObj[0].winner.rev);
                                    })
                                    .then(function() {
                                        console.log('DONE');
                                        helper.dom.appendInnerHTMLIO('', el);
                                    });
                                });




                        

                        helper.dom.appendChildNodeIO(newInput, el);
                        
                        let newBold = helper.dom.createElement('b');
                        helper.dom.appendInnerHTMLIO('Keep: ' + item.conflict.name, newBold);
                        helper.dom.appendChildNodeIO(newBold, el);

                    });
                });

              

                
                
                
            }
            


            function getConflictRows(docs) {
                console.log(docs);
                return docs['rows'].filter(function(row) {
                    return row.doc._conflicts;
                });
            }


            function getConflictingObjs(conflictRows, db) {
                return new Promise(function (resolve, reject) {

                    Promise.all(conflictRows.map(function(conflictRow) {
                        return getRevisions(conflictRow.doc.country, conflictRow.doc.written, conflictRow.doc._rev, conflictRow.doc._conflicts, conflictRow.doc._id, db);
                    })).then((results) => {
                        resolve(results);
                    });
                });
                
            }


            function getRevisions(winnerName, winnerWritten, winnerRev, conflictingRevs, docId, db) {
                console.log(conflictingRevs);
                return new Promise(function(resolve, reject) {
                    Promise.all(conflictingRevs.map(function(conflictingRev) {
                        return db.get(docId, {rev: conflictingRev}).then(function(doc) {
                            console.log(doc);
                            return {
                                winner: {
                                    name: winnerName,
                                    written: winnerWritten,
                                    rev: winnerRev
                                },
                                conflict: {
                                    name: doc.country,
                                    written: doc.written,
                                    rev: doc._rev
                                },
                                docId: docId
                            };
                        });
                    })).then((results) => resolve(results));
                });
                
            }


            function deleteRevision(rev, docId, db) {
                db.remove(docId, rev);
            }



            //fetchAll(db).then((countries) => displayList(countries, 'countries', db));

            fetchAll(db)
            .then((countries) => displayList(countries, 'countries', db))
            .then(() => db.sync(remoteCouch, { conflicts: true, include_docs: true}))
            .then(function() {
                console.log('sy');
                fetchAll(db).then((countries) => displayList(countries, 'countries', db));
            });


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



            /// SKA BARA GÖRA EN RAD I TAGET - ÄDRA ÄVEN FRÅN TABLE TILL DIV
            function displayList(docs, id, db) {

                let data = '';
                let el = helper.dom.getElement('id', id);

                helper.dom.appendInnerHTMLIO(data, el);

                if (docs.rows.length > 0) {

                    docs.rows.forEach((row) => {

                        let tdEl;
                        let trEl;
                        let inputEl;
                        let buttonEl;

                        trEl = helper.dom.createElement('tr');

                        tdEl = helper.dom.createElement('td');
                        helper.dom.appendInnerHTMLIO(row.doc.country, tdEl);
                        helper.dom.appendChildNodeIO(tdEl, trEl);
                        
                        tdEl = helper.dom.createElement('td');
                        inputEl = helper.dom.createElement('input');
                        buttonEl = helper.dom.createElement('button');
                        helper.dom.setAttribute('id', 'editField-' + row.doc._id, inputEl);
                        helper.dom.setAttribute('type', 'text', inputEl);
                        helper.dom.setAttribute('id', 'editButton-' + row.doc._id, buttonEl);
                        helper.dom.appendInnerHTMLIO('Edit', buttonEl);

                        buttonEl.addEventListener('click', function () {
                            putAndReload(inputEl.getAttribute('id').slice(10), 'countries', db);
                        });

                        helper.dom.appendChildNodeIO(inputEl, tdEl);
                        helper.dom.appendChildNodeIO(buttonEl, tdEl);
                        helper.dom.appendChildNodeIO(tdEl, trEl);

                        tdEl = helper.dom.createElement('td');
                        inputEl = helper.dom.createElement('input');
                        buttonEl = helper.dom.createElement('button');
                        helper.dom.setAttribute('id', 'deleteField-' + row.doc._id, inputEl);
                        helper.dom.setAttribute('type', 'text', inputEl);
                        helper.dom.setAttribute('id', 'deleteButton-' + row.doc._id, buttonEl);
                        helper.dom.appendInnerHTMLIO('Delete', buttonEl);

                        buttonEl.addEventListener('click', function () {
                            putAndReload(inputEl.getAttribute('id').slice(12), 'countries', db);
                        });

                        helper.dom.appendChildNodeIO(inputEl, tdEl);
                        helper.dom.appendChildNodeIO(buttonEl, tdEl);
                        helper.dom.appendChildNodeIO(tdEl, trEl);

                        helper.dom.appendChildNodeIO(trEl, el);
                    });
                    

                    // for (var i = 0; i < docs.rows.length; i++) {
                    //     let data = '';
            
                    //     data += '<td>' + docs.rows[i].doc.country + '</td>';
                    //     data += '<td><input type="text" id="' + "editField-" + docs.rows[i].doc._id + '"><button id="' + "editButton-" + docs.rows[i].doc._id + '">Edit</button></td>';
                    //     data += '<td><input type="text" id="' + "deleteField-" + docs.rows[i].doc._id + '"><button id="' + "deleteButton-" + docs.rows[i].doc._id + '">Delete</button></td>';
                    
                    //     let tblrow = helper.dom.createElement('tr');
                    //     tblrow.innerHTML = data;
                    //     //el.innerHTML += data;
            
                    //     let editField = tblrow.children[1].children[0];
                    //     let editButton = tblrow.children[1].children[1];
                    
                    // editButton.addEventListener('click', function () {
                    //     //console.log('db in event listener');
                    //     //console.log(db);
                    //     putAndReload(editField.getAttribute('id').slice(10), 'countries', db);
                    // });
                    
                    
                    //     let deleteField = tblrow.children[2].children[0];
                    //     let deleteButton = tblrow.children[2].children[1];
                    
                    //     deleteButton.addEventListener('click', function () {
                    //         deleteAndReload(deleteField.getAttribute('id').slice(12), 'countries', db);
                    //     });
                    
                    //     //console.log(tblrow.children[0].children[1].children[0].getAttribute('id'));
                    
                    //     el.appendChild(tblrow);
                    // }
                }
            
                
                return el;
            }




        
        

        document.getElementById('add-button').addEventListener('click', function () {
            postAndReload('countries', db);
        });



           //DONE     
        function postAndReload(domId, db) {
            getValueFromField('', 'add-name')
            .then((value) => postDoc(value, db))
            .catch(function() {
                console.log('error');
            });
        }


            //DONE
        function postDoc(value, db) {
            return new Promise(function(resolve, reject) {
                let doc = {
                    _id: new Date().toISOString(),
                    country: value,
                    written: new Date().toISOString()
                    };
                resolve(db.put(doc));   
            });      
        }
        


        
        //Done
        function putAndReload(docId, id, db) {
            getValueFromField('editField-', docId)
            .then((value) => putDoc(value, docId, db))

            .catch(function() {
                console.log('error');
            });
        }

        //DONE
        function putDoc(newValue, docId, db) {
            return getDoc(docId, db)
                .then((doc) => editDoc(doc, newValue, db))
                .catch((err) => console.log(err));  
        }

        //DONE
        function getDoc(docId, db) {
            return db.get(docId, {
                conflicts: true,
                include_docs: true
            });      
        }

        function fetchAll(db) {
            return db.allDocs({
                include_docs: true,
                conflicts: true
            });  
      }

        //DONE
        function editDoc(doc, newValue, db) {
            return new Promise(function(resolve, reject) {
                doc.country = newValue;
                doc.written = new Date().toISOString();
                resolve(db.put(doc));   
            });      
        }

        function deleteDoc(docId, db) {
            return getDoc(docId, db)
                .then((doc) => removeDoc(doc, db));    
        }


        //DONE
        function removeDoc(doc, db) {
            return new Promise(function(resolve, reject) {
                doc._deleted = true;
                doc.written = new Date().toISOString();
                resolve(db.put(doc));  
            });      
        }


        //DONE
        function deleteAndReload(docId, id, db) {
            deleteDoc(docId, db)



            .catch(function() {
                console.log('error');
            });
        }



        

        
        //DONE
        function getValueFromField(domIdPrefix, domIdSuffix) {
            return new Promise(function(resolve, reject) {
                var el = document.getElementById(domIdPrefix + domIdSuffix);
                var value = el.value;
                if (value) {
                    el.value = '';
                    resolve(value);
                }
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



        




        // let el = helper.dom.getElement('id', 'conflicts');

        // helper.dom.appendInnerHTMLIO('', el);

        // fetchAll(db)
        // .then((docs) => getConflictRows(docs))
        // // .then((conflictingObjs) => {
        // //     console.log(conflictingObjs);
        // // });
        // .then((conflictRows) => getConflictingObjs(conflictRows, db))
        // .then((conflictingObjs) => {
        //     console.log(conflictingObjs);
        //     if (!isEmpty(conflictingObjs)) {
        //         displayConflicts(conflictingObjs);
        //     }
            
        // });












        
        

        







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


                    //     .then((result) => {
        //         console.log('RESULT');
        //         console.log(result);
        //         fetchAll(db)
        //         .then((countries) => displayList(countries, id, db))
        //         .then(() => db.sync(remoteCouch, {conflicts: true, include_docs: true}))
        //         .then(function(item) {
        //           console.log('ITEM');
        //           console.log(item);
        //         })
        //         .then(function() {
        //           db.get(itemId, {rev: result.rev, conflicts: true}).then(function(doc) {
        //               console.log('HERE!!');
        //               console.log(doc);
        //               return conflictSolver(doc)
        //               .then((conflictObj) => chooseWinner(conflictObj))
        //               .then(() => fetchAll(db))
        //               .then((countries) => displayList(countries, 'countries', db));
        //           });
        //         });
        //   });