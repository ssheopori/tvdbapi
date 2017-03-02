//core deps
var https       = require('https');
var moment      = require('moment');
var fs          = require('fs');
var _           = require('lodash');

//my deps
var apikey      = require('./secrets.json');
var tokenFile   = require('./token.json');


//cache object
var cache       = [];


var checkTokenExpireTime = function(){
    //check for token expire time
    console.log("Expire Time: ", tokenFile.expireTime);
    console.log("Current Time: ", moment());    
    return moment(tokenFile.expireTime).isBefore(moment());
};
var saveTokenToFile = function(tokenData){
    //set expire time to 20hrs from now
    //maybe shld be 24 really
    var expireTime = moment().add(20, 'h');
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
            path: '/search/series?name=' + searchString.replace(" ", "%20"),
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


        req.on('error', function(err){
            console.log(err);
            reject(err);
        });    

        if(checkTokenExpireTime()){
            console.log("expired token!");


        }else{           
            
            console.log("calling cache...");            
            var data = searchInCache(searchString);                        
            if(data){
                console.log("cache found...");
                resolve(data);
            }else{
                console.log("cache not found");
                req.end();
            }
            
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
//find searchString in cache
var searchInCache = function(searchString){    
    var val = _.find(cache, function(s){
        console.log("looping in cache...");
        return s.searchString === searchString;
    });
    return val;
};   


module.exports = {
    initAPI: init,
    searchByName: searchByName
}