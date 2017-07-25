//Core Deps
var _           = require('lodash');



var cache   = [];
var seriesDetailsCache  = [];


var searchInCache = function(searchString){    
    var val = _.find(cache, function(s){
        console.log("looping in cache...");
        return s.searchString === searchString;
    });
    return val;
}


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
}


var addSeriesDetailsToCache = function(cacheObject, seriesID){

    cacheObject = JSON.parse(cacheObject);
    seriesDetailsCache.push(cacheObject);        
};

//find series details in cache
var searchSeriesDetailsInCache = function(seriesID){    
    var val = _.find(seriesDetailsCache, function(s){        
        return s.data.id == seriesID;
    });
    return val;
};



module.exports = {
    addToCache: addToCache,
    searchInCache: searchInCache,    
    addSeriesDetailsToCache: addSeriesDetailsToCache,
    searchSeriesDetailsInCache: searchSeriesDetailsInCache
}