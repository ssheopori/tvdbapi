//core deps
var https       = require('https');
var moment      = require('moment');
var fs          = require('fs');
var _           = require('lodash');

//my deps
var apikey      = require('./secrets.json');
var tokenFile   = require('./token.json');


//cache object
var cache               = [];
var seriesDetailsCache  = [];

var checkTokenExpireTime = function(){
    //check for token expire time
    console.log("Expire Time: ", moment(tokenFile.expireTime));
    console.log("Current Time: ", moment());    
    return moment(tokenFile.expireTime).isBefore(moment());
};
var saveTokenToFile = function(tokenData){
    //set expire time to 20hrs from now
    //maybe shld be 24 really
    var nowTime = moment();
    var expireTime = nowTime.add(20, 'h');
    tokenFile.expireTime = expireTime;
    tokenFile.token = tokenData;

    try{
        fs.writeFileSync(__dirname + '/token.json' , JSON.stringify(tokenFile), 'utf8');
        console.log("token saved to file...");
    }catch(err){
        console.log("TOKEN FILE LOST!!");
    }    
};
//login and get token
var login = function(){

    var options = {
        hostname: 'api.thetvdb.com',
        port: 443,
        path: '/login',
        method: 'post',
        headers: {
            'Content-Type': 'application/json'            
        }               
    };

    var req = https.request(options, (res) => {

        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);               

        res.on('data', (d) => {
            var retData = JSON.parse(d);
            console.log("Token Received: ", retData.token);

            saveTokenToFile(retData.token);            

        });

    });


    req.on('error', function(err){
        console.log(err);
    });

    req.write(JSON.stringify(apikey));

    req.end();
};
//init web Server
var init = function(){

    //do truty check
    console.log("checking exiting tokenfile...");
    if(tokenFile.token && tokenFile.expireTime){
        //token exists, now check if its expired
        console.log("checking for expire time for token...");
        if(checkTokenExpireTime()){
            //expired token
            //need to renew
            console.log("Renewing Token...");
            login();
            //
        }else{
            console.log("Token is good!");
        }

    }else{

        //we need to login
        console.log("Logging into TVDB...");
        login();

    }

};
//search TVDB by Series Name
var searchByName = function(searchString){    

    //return a promise
    return new Promise(function(resolve,reject){
        
        var retData = [];        

        var options = {
            hostname: 'api.thetvdb.com',
            port: 443,
            path: '/search/series?name=' + searchString.replace(/ /g, "%20"),
            method: 'get',
            headers: {            
                'Authorization': "Bearer " + tokenFile.token
            }               
        };

        var req = https.request(options, (res) => {
            console.log('statusCode:', res.statusCode);
            //console.log('headers:', res.headers);               

            res.on('data', (d) => {    
                retData +=  d;                        
            });

            res.on('end', function(){
                if(res.statusCode != 200){
                    reject(res.statusCode);
                }else{
                    console.log("Adding To Cache...", searchString);
                    addToCache(retData,searchString);
                    resolve(retData);
                }                
            });

        });

        //Sid
        //March-28-2017
        //not sure if we need this here, commenting out req.on error
        /*req.on('error', function(err){
            console.log(err);
            reject(err);
        });*/

        if(checkTokenExpireTime()){
            console.log("Token has expired. Logging in to get new token");
            login();
        }
        
            
        console.log("calling cache...");            
        var data = searchInCache(searchString);                        
        if(data){
            console.log("cache found...");
            resolve(data);
        }else{
            console.log("cache not found");
            req.end();
        }
            
                

    });        
};
//search Series by ID
var getPosterBySeriesID = function(seriesID){
    //return a promise
    return new Promise(function(resolve,reject){
        
        var retData = [];        

        var options = {
            hostname: 'api.thetvdb.com',
            port: 443,
            path: '/series/' + seriesID + '/images/query?keyType=poster',
            method: 'get',
            headers: {            
                'Authorization': "Bearer " + tokenFile.token
            }               
        };

        var req = https.request(options, (res) => {
            console.log('statusCode:', res.statusCode);
            //console.log('headers:', res.headers);               

            res.on('data', (d) => {    
                retData +=  d;                        
            });

            res.on('end', function(){
                if(res.statusCode != 200){
                    reject(res.statusCode);
                }else{
                    console.log("Adding Posters To Cache...", seriesID);
                    addPosterToCache(retData,seriesID);
                    resolve(retData);
                }                
            });

        });


        //Sid
        //March-28-2017
        //not sure if we need this here, commenting out req.on error
        /*req.on('error', function(err){
            console.log(err);
            reject(err);
        });*/

        if(checkTokenExpireTime()){
            console.log("Token has expired. Logging in to get new token");
            login();
        }
            
        console.log("calling cache...");            
        var data = searchPosterInCache(seriesID);                        
        if(data){
            console.log("cache found...");
            resolve(data);
        }else{
            console.log("cache not found");
            req.end();
        }
            

    });

};
var getSeriesDetails = function(seriesID){
    //return a promise
    return new Promise(function(resolve,reject){
        
        var retData = [];        

        var options = {
            hostname: 'api.thetvdb.com',
            port: 443,
            path: '/series/' + seriesID,
            method: 'get',
            headers: {            
                'Authorization': "Bearer " + tokenFile.token
            }               
        };

        var req = https.request(options, (res) => {
            console.log('statusCode:', res.statusCode);
            //console.log('headers:', res.headers);               

            res.on('data', (d) => {    
                retData +=  d;                        
            });

            res.on('end', function(){
                if(res.statusCode != 200){
                    reject(res.statusCode);
                }else{
                    console.log("Getting Series Details...", seriesID);
                    addSeriesDetailsToCache(retData,seriesID);
                    resolve(retData);
                }                
            });

        });

        //Sid   
        //March-28-2017
        //not sure if we need this here, commenting out req.on error
        /*req.on('error', function(err){
            console.log(err);
            reject(err);
        });*/

        if(checkTokenExpireTime()){
            console.log("Token has expired. Logging in to get new token");
            login();
        }        
            
        console.log("calling cache...");            
        var data = searchSeriesDetailsInCache(seriesID);                        
        if(data){
            console.log("cache found...");
            resolve(data);
        }else{
            console.log("cache not found");
            req.end();
        }
            
                

    });

};

//add search results to cache
var addToCache = function(cacheObject, searchString){

    cacheObject = JSON.parse(cacheObject);

    var tmp = {
        "searchString": searchString,
        "data" : []
    };

    _.forEach(cacheObject.data, function(value){                
        tmp.data.push(value);
    });
    cache.push(tmp);        
};
//add series details to cache
var addSeriesDetailsToCache = function(cacheObject, seriesID){

    cacheObject = JSON.parse(cacheObject);

    /*
    var tmp = {
        "seriesID": seriesID,
        "data" : []
    };

    _.forEach(cacheObject.data, function(value){                
        tmp.data.push(value);
    });
    */
    seriesDetailsCache.push(cacheObject);        
};
//find searchString in cache
var searchInCache = function(searchString){    
    var val = _.find(cache, function(s){
        console.log("looping in cache...");
        return s.searchString === searchString;
    });
    return val;
};
//find series details in cache
var searchSeriesDetailsInCache = function(seriesID){    
    var val = _.find(seriesDetailsCache, function(s){
        console.log("looping in cache...");
        console.log(s);
        console.log(s.data.id);
        return s.data.id == seriesID;
    });
    return val;
};
var renewToken = function(){
    login();
};



module.exports = {
    initAPI: init,
    searchByName: searchByName,
    getSeriesDetails: getSeriesDetails
}