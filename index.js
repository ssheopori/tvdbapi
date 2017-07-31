//core deps
var express     = require('express');
var jwt         = require('express-jwt');
var util        = require('util');
var app         = express();

//my deps
var api         = require('./modules/api');


//hack
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


//middleware
/*
var clientAuth = jwt({
    secret: authSecrets.secret,
    audience: authSecrets.audience
});
*/


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
2. Get Show Details by Series ID

*/
app.get('/public/search/:show', function(req,res){    
    console.log("searching for...", req.params.show);
    
    api.searchByName(req.params.show).then(function(reData){
        console.log("data to send back: ", reData);
        res.send(reData);
    },function(err){
        console.log("no data...", err);
        res.sendStatus(err);
    });
});

app.get('/public/getSeriesDetails/:seriesID', function(req,res){    
    console.log("getting series details for...", req.params.seriesID);
    
    api.getSeriesDetails(req.params.seriesID).then(function(reData){
        console.log("data to send back: ", reData);
        res.send(reData);
    },function(err){
        console.log("no data...", err);
        res.sendStatus(err);
    });
});


/* 
Private routes
Client does need to be Authenticated

1. Add Show to FAV
2. Add Show to WatchList
*/



var port = process.env.port || 3131;

//init TVDB API
console.log("Init TVDB API...");
api.initAPI().then(function(success){
    
    console.log('API INIT COMPLETE');
    console.log(success);
    
    //listner    
    app.listen(port, function() {
        console.log('App listening on port: ', port);
    });



}, function(error){
    console.log('ERR');
    console.log(error);
});







