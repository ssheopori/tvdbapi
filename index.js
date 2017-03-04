//core deps
var express     = require('express');
var jwt         = require('express-jwt');
var util        = require('util');
var app         = express();

//my deps
var api         = require('./modules/api');
var authSecrets = require('./authSecrets.json');


//hack
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


//middleware
var clientAuth = jwt({
    secret: authSecrets.secret,
    audience: authSecrets.audience
});


//routes
//enable CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


/* 
Public routes
Client does not need to be Authenticated

1. Search TV Show by Name

*/
app.get('/public/search/:show', function(req,res){    
    console.log("searching for...", req.params.show);
    
    api.searchByName(req.params.show).then(function(reData){
        console.log("data to send back: ", reData);
        res.send(reData);
    }).catch(function(err){
        console.log("no data...", err);
    });
});

/* 
Private routes
Client does not need to be Authenticated

1. Add Show to FAV
2. Add Show to WatchList
*/



//init TVDB API
console.log("Init TVDB API...");
//api.initAPI();


/*
var _ = require('lodash');
var cache = require('./tmp.json');
var blah = _.find(cache, function(s){        
    return s.searchString === 'Lucifer';
});
console.log(blah);
*/


//listner
var port = process.env.port || 3131;
app.listen(port, function() {
    console.log('App listening on port: ', port);
});




