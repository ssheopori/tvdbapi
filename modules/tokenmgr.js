//Code Deps
var moment      = require('moment');
var fs          = require('fs');
var https       = require('https');

//my Deps
var tokenFile   = require('./token.json');


var validateToken = function(){
    console.log("checking existing token");
        
    //check tokenfile elements
    if(tokenFile.token && tokenFile.expireTime){
        //token exists, now check if its expired
        console.log("checking for expire time for token...");
        if(checkTokenExpireTime()){
            //expired token
            //need to renew
            console.log("Renewing Token...");
            return(login());
            
        }else{
            console.log("Token is good!");            
            return true;
        }
    }else{
        //we need to login and gen new token
        console.log("Logging into TVDB...");
        return(login());
    }
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
            return true;
        });

    });


    req.on('error', function(err){
        console.log(err);
        return false;
    });

//    req.write(JSON.stringify(apikey));

    req.end();
};




module.exports = {
    validateToken: validateToken,
    tokenFile: tokenFile
}