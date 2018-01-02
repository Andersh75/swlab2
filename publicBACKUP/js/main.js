document.addEventListener('DOMContentLoaded', function() {

    document.getElementById('add-button').addEventListener('click', function () {
        addAndReload();
    });

    // document.getElementById('edit-button').addEventListener('click', function () {
    //     editAndReload();
    // });

    // document.getElementById('delete-button').addEventListener('click', function () {
    //     deleteAndReload();
    // });


    var db = new PouchDB('kittens');

    fetchAll().then((countries) => displayList(countries))
    
    var remoteCouch = 'http://127.0.0.1:5984/kittens';
    
    
    function fetchAll() {
        var el = document.getElementById('countries');
          return db.allDocs({
              include_docs: true,
              attachments: true
          });  
    }
    
    
    function editAndReload(itemId) {
        editOne(itemId)
        .then((country) => editRecord(country, itemId))
        // editRecord(itemId)
        .then(() => fetchAll())
        .then((countries) => displayList(countries))
        .then(() => {
            db.sync(remoteCouch).on('complete', function () {
                console.log('in sync');
                }).on('error', function (err) {
                console.log('sync error');
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
    
    function editRecord(item, itemId) {
        return db.get(itemId, {conflicts: true}).then(function(doc) {
            console.log(doc);
            doc.country = item;
            return db.put(doc);
        }).catch(function(err) {
            console.log(err);
        });  
    }
    
    function deleteAndReload(itemId) {
        deleteOne(itemId)
        .then(() => fetchAll())
        .then((countries) => displayList(countries))
        .then(() => {
            db.sync(remoteCouch).on('complete', function () {
                console.log('in sync');
                }).on('error', function (err) {
                console.log('sync error');
            });
        });
    }
    
    // function addAndReload() {
    //     addOne()
    //     .then((country) => addRecord(country))
    //     .then(() => fetchAll())
    //     .then((countries) => displayList(countries))
    //     .then(() => {
    //         db.sync(remoteCouch).on('complete', function () {
    //             console.log('in sync');
    //             }).on('error', function (err) {
    //             console.log('sync error');
    //         });
    //     });
    // }


    function addAndReload() {
        addOne()
        .then((country) => addRecord(country))
        .then(() => fetchAll())
        .then((countries) => displayList(countries))
        .then(() => {
            navigator.serviceWorker.ready.then(function(registration) {
                registration.sync.register('kittens').then(() => {
                    console.log('Sync registered');
                    //console.log('tags: ', registration.sync.getTags());
                });
            });

            
        });
    }
    
    function deleteOne(item) {
        return db.get(item, {conflicts: true}).then(function(doc) {
            console.log(doc);
            return db.remove(doc);
        });  
    }
    
    
    function addRecord(item) {
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
    
    
    function displayList(countries) {
        var el = document.getElementById('countries');
        var data = '';
        if (countries.rows.length > 0) {
            for (i = 0; i < countries.rows.length; i++) {
                data += '<tr>';
                data += '<td>' + countries.rows[i].doc.country + '</td>';
                data += '<td><input type="text" id="' + "editField-" + countries.rows[i].doc._id + '"><button id="' + "editButton-" + countries.rows[i].doc._id + '">Edit</button></td>';
                data += '<td><input type="text" id="' + "deleteField-" + countries.rows[i].doc._id + '"><button id="' + "deleteButton-" + countries.rows[i].doc._id + '">Delete</button></td>';
                data += '</tr>';
            }
        }

        el.innerHTML = data;

        let editField = el.children[0].children[1].children[0];
        let editButton = el.children[0].children[1].children[1];

        editButton.addEventListener('click', function () {
            editAndReload(editField.getAttribute('id').slice(10));
        });


        let deleteField = el.children[0].children[2].children[0];
        let deleteButton = el.children[0].children[2].children[1];

        deleteButton.addEventListener('click', function () {
            deleteAndReload(deleteField.getAttribute('id').slice(12));
        });

        console.log(el.children[0].children[1].children[0].getAttribute('id'));
        return el;
    }


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



            // var request = new Request('http://localhost:4000/api/bear/5a3a6e0b88d81d72a6600f43', {
            //     method: 'DELETE', 
            //     mode: 'cors', 
            //     redirect: 'follow',
            //     headers: new Headers({
            //         'Content-Type': 'text/json'
            //     })
            // });
            
            // // Now use it!
            // setTimeout(function() {
            //     fetch(request);
            // }, 3000);


            


       

    // fetch('http://localhost:4000/api/bears').then(function(myres) {
    //     console.log('myres: ', myres);
    //     //document.getElementById('third').innerHTML = myres[0].name;
    // });

    
    



}, false);


