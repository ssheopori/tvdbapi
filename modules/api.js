//core deps
var https       = require('https');

//my deps
var tokenMgr    = require('./tokenmgr.js');
var cacheMgr    = require('./cachemgr.js');


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
                'Authorization': "Bearer " + tokenMgr.getReadOnlyToken
            }               
        };

        var req = https.request(options, (res) => {
            console.log('statusCode:', res.statusCode);            

            res.on('data', (d) => {    
                retData +=  d;                        
            });

            res.on('end', function(){
                if(res.statusCode != 200){
                    reject(res.statusCode);
                }else{                    
                    cacheMgr.addToCache(retData,searchString);
                    resolve(retData);
                }                
            });

        });        
        

        if(tokenMgr.validateToken()){            

            var data = cacheMgr.searchInCache(searchString);
            
            if(data){
                console.log("data found in cache...");
                resolve(data);
            }else{                
                req.end();
            }

        }else{
            reject('token could not be validated!');
        }
        

        req.on('error', function(err){
            console.log(err);
            reject(err);
        });
        
                

    });        
};

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
                'Authorization': "Bearer " + tokenMgr.getReadOnlyToken
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
                    resolve(retData);
                }                
            });

        });


        //check token
        if(tokenMgr.validateToken()){
            req.end();            
        }else{
            reject('token could not be renewed');
        }           

    });

};

//get series details
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
                'Authorization': "Bearer " + tokenMgr.getReadOnlyToken
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
                    cacheMgr.addSeriesDetailsToCache(retData,seriesID);
                    resolve(retData);
                }                
            });

        });


        if(tokenMgr.validateToken()){            

            //var data = searchInCache(searchString);                        
            var data = cacheMgr.searchSeriesDetailsInCache(seriesID);  
            
            if(data){
                console.log("data found in cache...");
                resolve(data);
            }else{                
                req.end();
            }

        }else{
            reject('token could not be validated!');
        }
        

        req.on('error', function(err){
            console.log(err);
            reject(err);
        });     

    });

};


var init = function(){

    return new Promise(function(resolve, reject){

        tokenMgr.validateToken().then(function(success){            
            resolve('API Init Complete! Success');
        }, function(error){            
            reject(error);
        });    
    });   

}


module.exports = {
    initAPI: init,
    searchByName: searchByName,
    getSeriesDetails: getSeriesDetails
}