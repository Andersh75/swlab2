const express = require('express');
const bodyParser= require('body-parser')
const path = require('path');
const mongoose = require('mongoose');
const Bear = require('./app/models/bear');
const Blog = require('./app/models/blog');
const Interest = require('./app/models/interest');
const Inflation = require('./app/models/inflation');

const app = express();
const routerAPI = express.Router();


mongoose.connect('mongodb://andersh75:-Gre75mger-@ds161336.mlab.com:61336/mongotest');


app.listen('4000');

app.use('/api', routerAPI);
// app.use(express.static(path.join(__dirname, 'html')));
// app.use(express.static(path.join(__dirname, 'css')));
// app.use(express.static(path.join(__dirname, 'javascript')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());



// ROUTE MIDDLEWARE
// ==============================================

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



// ROUTES
// ==============================================

app.route('/login')

    .get(function(req, res) {
        res.send('this is the login form');
    })

    .post(function(req, res) {
        console.log('processing');
        res.send('processing the login form!');
    });


// routerAPI.route('/bear')
//     .post(function(req, res) {

//         var bear = new Bear();
//         bear.name = req.body.name;

//         bear.save(function(err) {
//             if (err)
//                 res.send(err);

//             res.json({ message: req.body });
//         });
//     })
//     .get(function(req, res) {
//         Bear.find(function(err, bears) {
//             if (err)
//                 res.send(err);

//             res.json(bears);
//         });
//     });


// routerAPI.route('/bear/:bear_id')
//     .get(function(req, res) {
//         Bear.findById(req.params.bear_id, function(err, bear) {
//             if (err)
//                 res.send(err);
//             res.json(bear);
//         });
//     })
//     .put(function(req, res) {
//         Bear.findById(req.params.bear_id, function(err, bear) {

//             if (err)
//                 res.send(err);

//             bear.name = req.body.name;

//             bear.save(function(err) {
//                 if (err)
//                     res.send(err);

//                 res.json({ message: 'Bear updated!' });
//             });

//         });
//     })
//     .delete(function(req, res) {
//         Bear.remove({
//             _id: req.params.bear_id
//         }, function(err, bear) {
//             if (err)
//                 res.send(err);

//             res.json({ message: 'Successfully deleted' });
//         });
//     });





routerAPI.route('/blog')
    .post(function(req, res) {

        var blog = new Blog();
        blog.author = req.body.author;
        blog.id = req.body.id;

        console.log(req.body);

        blog.save(function(err) {
            if (err) {
                res.send(err);
            }
                

            res.json({ message: req.body });
        });
    })
    .get(function(req, res) {
        Blog.find(function(err, blogs) {
            if (err) {
                res.send(err);
            }

            res.json(blogs);
        });
    });


routerAPI.route('/blog/:blog_id')
    .get(function(req, res) {
        Blog.findOne({'id': req.params.blog_id}, function(err, blog) {
            if (err) {
                res.send(err);
            }
            res.json(blog);
        });
    })
    .put(function(req, res) {
        //console.log('body', req.body);
        Blog.findOne({'id': req.params.blog_id}, function(err, blog) {
            console.log(req.body);
            console.log(blog);

            if (err) {
                res.send(err);
            }

            blog.author = req.body.author;
            

            blog.save(function(err) {
                if (err) {
                    res.send(err);
                }

                res.json({ message: 'blog updated!' });
            });

        });
    })
    .delete(function(req, res) {
        Blog.remove({
            id: req.params.blog_id
        }, function(err, blog) {
            if (err) {
                console.log('ERROR!');
                res.send(err);
            } else {
                console.log('DELETED!');
                res.json({ message: 'Successfully deleted' });
            }


        });
    });



    routerAPI.route('/inflation')
    .post(function(req, res) {

        var inflation = new Inflation();
        inflation.rate = req.body.rate;
        inflation.id = req.body.id;

        console.log(req.body);

        inflation.save(function(err) {
            if (err) {
                res.send(err);
            }

            res.json({ message: req.body });
        });
    })
    .get(function(req, res) {
        Inflation.find(function(err, inflations) {
            if (err) {
                res.send(err);
            }

            res.json(inflations);
        });
    });


routerAPI.route('/inflation/:inflation_id')
    .get(function(req, res) {
        Inflation.findOne({'id': req.params.inflation_id}, function(err, inflation) {
            if (err) {
                res.send(err);
            }
            res.json(inflation);
        });
    })
    .put(function(req, res) {
        //console.log('body', req.body);
        Inflation.findOne({'id': req.params.inflation_id}, function(err, inflation) {
            console.log(req.body);
            console.log(inflation);

            if (err) {
                res.send(err);
            }

            inflation.rate = req.body.rate;
            

            inflation.save(function(err) {
                if (err) {
                    res.send(err);
                }

                res.json({ message: 'inflation updated!' });
            });

        });
    })
    .delete(function(req, res) {
        Inflation.remove({
            id: req.params.inflation_id
        }, function(err, inflation) {
            if (err) {
                console.log('ERROR!');
                res.send(err);
            } else {
                console.log('DELETED!');
                res.json({ message: 'Successfully deleted' });
            }


        });
    });



    routerAPI.route('/interest')
    .post(function(req, res) {

        var interest = new Interest();
        interest.rate = req.body.rate;
        interest.id = req.body.id;

        console.log(req.body);

        interest.save(function(err) {
            if (err) {
                res.send(err);
            }

            res.json({ message: req.body });
        });
    })
    .get(function(req, res) {
        Interest.find(function(err, interests) {
            if (err) {
                res.send(err);
            }

            res.json(interests);
        });
    });


routerAPI.route('/interest/:interest_id')
    .get(function(req, res) {
        Interest.findOne({'id': req.params.interest_id}, function(err, interest) {
            if (err) {
                res.send(err);
            }
            res.json(interest);
        });
    })
    .put(function(req, res) {
        //console.log('body', req.body);
        Interest.findOne({'id': req.params.interest_id}, function(err, interest) {
            console.log(req.body);
            console.log(interest);

            if (err) {
                res.send(err);
            }

            interest.rate = req.body.rate;
            

            interest.save(function(err) {
                if (err) {
                    res.send(err);
                }

                res.json({ message: 'interest updated!' });
            });

        });
    })
    .delete(function(req, res) {
        Interest.remove({
            id: req.params.interest_id
        }, function(err, interest) {
            if (err) {
                console.log('ERROR!');
                res.send(err);
            } else {
                console.log('DELETED!');
                res.json({ message: 'Successfully deleted' });
            }


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