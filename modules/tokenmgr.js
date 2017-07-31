//Core Deps
var moment      = require('moment');
var fs          = require('fs');
var https       = require('https');

//my Deps
var tokenFile   = require('./token.json');
var apikey      = require('./secrets.json');


var validateToken = function(){
    console.log("checking existing token");


    return new Promise(function(resolve, reject){

        //if both values are present
        if(tokenFile.token && tokenFile.expireTime){
            //token exists, now check if its expired
            console.log("checking for expire time for token...");
            if(checkTokenExpireTime()){
                
                //expired token //need to renew
                console.log("Token Has Expired.");

                login().then(function(res){                    
                    resolve('login success');
                },function(err){
                    console.log('login failed');                    
                    reject(err);
                });            
                
            }else{
                console.log("Token is good!");            
                resolve('Token is good');
            }
        }else{
            //we need to login and gen new token
            console.log("Logging into TVDB...");
            login().then(function(res){
                resolve('login success');
            },function(err){
                reject(err);
            });            
        }



    });
        

}


var checkTokenExpireTime = function(){    
    console.log("Expire Time: ", moment(tokenFile.expireTime));
    console.log("Current Time: ", moment());    
    return moment(tokenFile.expireTime).isBefore(moment());
}

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
}

//login to TVDB and generate new TOKEN
var login = function(){

    return new Promise(function(resolve, reject){

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
                resolve();
            });

        });


        req.on('error', function(err){
            console.log(err);
            reject(err);
        });

        req.write(JSON.stringify(apikey));

        req.end();
    });

};


var getReadOnlyToken = function(){
    return tokenFile.token;    
}

module.exports = {
    validateToken: validateToken,
    getReadOnlyToken: getReadOnlyToken
}