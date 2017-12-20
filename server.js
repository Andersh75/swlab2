const express = require('express');
const bodyParser= require('body-parser')
//const MongoClient = require('mongodb').MongoClient

var mongoose = require('mongoose');
mongoose.connect('mongodb://andersh75:-Gre75mger-@ds161336.mlab.com:61336/mongotest');

const app = express();
var router = express.Router();


//svar db

// MongoClient.connect('mongodb://andersh75:-Gre75mger-@ds161336.mlab.com:61336/mongotest', (err, database) => {
//   if (err) return console.log(err)
//   db = database
//   app.listen(3000, () => {
//     console.log('listening on 3000')
//   })
// })

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


// route middleware that will happen on every request
router.use(function(req, res, next) {

    // log each request to the console
    console.log(req.method, req.url);

    // continue doing what we were doing and go to the route
    next(); 
});

// route middleware to validate :name
router.param('name', function(req, res, next, name) {
    // do validation on name here
    // blah blah validation
    // log something so we know its working
    console.log('doing name validations on ' + name);

    // once validation is done save the new item in the req
    req.name = name.toUpperCase();
    // go to the next thing
    next(); 
});


router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});



router.get('/first', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
});

// route with parameters (http://localhost:8080/hello/:name)
router.get('/hello/:name', function(req, res) {
    res.send('hello ' + req.name + '!');
});



router.post('/quotes', (req, res) => {
    db.collection('quotes').save(req.body, (err, result) => {
      if (err) return console.log(err)
  
      console.log('saved to database')
      res.redirect('/')
    });
  });


router.get('/read', (req, res) => {
    db.collection('quotes').find().toArray(function(err, results) {
    res.send(results)
    // send HTML file populated with quotes here
    });
});

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


app.use('/api', router);

app.listen('3000');
