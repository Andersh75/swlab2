const express = require('express');
const bodyParser= require('body-parser')
var path = require('path');
var mongoose = require('mongoose');
var Bear = require('./app/models/bear');

const app = express();
var routerAPI = express.Router();


mongoose.connect('mongodb://andersh75:-Gre75mger-@ds161336.mlab.com:61336/mongotest');


app.listen('4000');

app.use('/api', routerAPI);
// app.use(express.static(path.join(__dirname, 'html')));
// app.use(express.static(path.join(__dirname, 'css')));
// app.use(express.static(path.join(__dirname, 'javascript')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


// route middleware that will happen on every request
routerAPI.use(bodyParser.urlencoded({extended: true}));
routerAPI.use(bodyParser.json());
routerAPI.use(function(req, res, next) {
    console.log(req.method, req.url);
    next(); 
});

// route middleware to validate :name
routerAPI.param('name', function(req, res, next, name) {
    console.log('doing name validations on ' + name);
    req.name = name.toUpperCase();
    next(); 
});






// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/public/index.html')
// });

// ROUTES
// ==============================================

app.route('/login')

    // show the form (GET http://localhost:8080/login)
    .get(function(req, res) {
        res.send('this is the login form');
    })

    // process the form (POST http://localhost:8080/login)
    .post(function(req, res) {
        console.log('processing');
        res.send('processing the login form!');
    });




routerAPI.route('/bears')

// create a bear (accessed at POST http://localhost:8080/api/bears)
.post(function(req, res) {

    var bear = new Bear();      // create a new instance of the Bear model
    bear.name = req.body.name;  // set the bears name (comes from the request)

    // save the bear and check for errors
    bear.save(function(err) {
        if (err)
            res.send(err);

        res.json({ message: req.body });
    });
    

})


.get(function(req, res) {
    Bear.find(function(err, bears) {
        if (err)
            res.send(err);

        res.json(bears);
    });
});




routerAPI.route('/bears/:bear_id')

    // get the bear with that id (accessed at GET http://localhost:8080/api/bears/:bear_id)
    .get(function(req, res) {
        Bear.findById(req.params.bear_id, function(err, bear) {
            if (err)
                res.send(err);
            res.json(bear);
        });
    })

    .put(function(req, res) {

        // use our bear model to find the bear we want
        Bear.findById(req.params.bear_id, function(err, bear) {

            if (err)
                res.send(err);

            bear.name = req.body.name;  // update the bears info

            // save the bear
            bear.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ message: 'Bear updated!' });
            });

        });
    })

    // delete the bear with this id (accessed at DELETE http://localhost:8080/api/bears/:bear_id)
    .delete(function(req, res) {
        Bear.remove({
            _id: req.params.bear_id
        }, function(err, bear) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    });


    app.route(['/', '/*'])
    
    .get((req, res) => {
        res.sendFile(__dirname + '/public/index.html')
    });










//const MongoClient = require('mongodb').MongoClient
//svar db

// MongoClient.connect('mongodb://andersh75:-Gre75mger-@ds161336.mlab.com:61336/mongotest', (err, database) => {
//   if (err) return console.log(err)
//   db = database
//   app.listen(3000, () => {
//     console.log('listening on 3000')
//   })
// })

//app.use(express.static(__dirname + '/public'));



// route with parameters (http://localhost:8080/hello/:name)
// routerAPI.get('/hello/:name', function(req, res) {
//     res.send('hello ' + req.name + '!');
// });



// routerAPI.post('/quotes', (req, res) => {
//     db.collection('quotes').save(req.body, (err, result) => {
//       if (err) return console.log(err)
  
//       console.log('saved to database')
//       res.redirect('/')
//     });
//   });


//   routerAPI.get('/read', (req, res) => {
//     db.collection('quotes').find().toArray(function(err, results) {
//     res.send(results)
//     // send HTML file populated with quotes here
//     });
// });


// app.get('/test', function(req, res) {
//     res.json({ message: 'hooray! welcome to our api!' });   
// });