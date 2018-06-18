
// Just a useful check if the right environment variables are set,
// if not, tell the user

let requiredEnvironmentVariables = [
    'BITBUCKET_API_TOKEN',
    'BITBUCKET_ORGANISATION_DOMAIN'
];

function requiredFieldsAreValid() {
    let count = requiredEnvironmentVariables.length;
    // let valid = true;
    for (let i = 0; i < count; i++) {
        if (!process.env[requiredEnvironmentVariables[i]]) {
        // TODO: Just check this is a valid JS way to exit a loop, might cause other issues if not correct
        return false;
        }
    }
    return true;
}

if (!requiredFieldsAreValid()) {
    console.log("ERROR: MISSING ENVIRONMENT VARIABLE!");
    console.log("Make sure you have set these environment variables:");
    let display = requiredEnvironmentVariables.reduce((strList, value) => {
        return strList += value + '=xxxxxxxx ';
    }, "");
    console.log(display);
}





var express = require('express'),
app = express(),
request = require('request'),
rp = require('request-promise'),
logstash_name = process.env.LOGSTASH_NAME || "logstash",
port = process.env.PORT || 3000,
bitbucket_api_token = process.env.BITBUCKET_API_TOKEN,
bitbucket_org_url = process.env.BITBUCKET_ORGANISATION_DOMAIN;

app.listen(port, () => {
    console.log('Environment variable PORT is: ' + port);
    console.log('Environment variables LOGSTASH_NAME is: ' + logstash_name);
});



app.get('/projects', (req, res) => {
    let url = "https://"+bitbucket_org_url+"/rest/api/2/project";
    let authtoken = bitbucket_api_token;
    fetchBitbucketAPIData(url, authtoken)
        .then((data) => {
            return sendBitbucketDataToLogstash(data, "http://"+logstash_name+":8051")
        })
        .then((data) => {
            res.send(data);
        }, (err) => {
            res.send(err);
        }).catch((err) => {
            res.send(err);
        });
});



app.get('/users', (req, res) => {
    let url = "https://"+bitbucket_org_url+"/rest/api/2/user/search/?username=%25&maxResults=10000";
    let authtoken = bitbucket_api_token;
    fetchBitbucketAPIData(url, authtoken)
        .then((data) => {
            return sendBitbucketDataToLogstash(data, "http://"+logstash_name+":8052")
        })
        .then((data) => {
            res.send(data);
        }, (err) => {
            res.send(err);
        }).catch((err) => {
            res.send(err);
        });
});



function fetchBitbucketAPIData(url, authtoken) {
    let headers = {
        // 'User-Agent': 'request',
        'Authorization' : 'Basic '+ authtoken,
        'Content-Type': 'application/json'
    };
    let options = {url, headers};
    return rp(options).then((body) => {
        return body;
    }, (err) => {
        return err;
    });
}



function sendBitbucketDataToLogstash(data, url) {
    let headers = {
        "Content-Type": "application/json"
    };
    let options = {
        method: "POST",
        body: JSON.parse(data),
        url, 
        headers,
        json: true
    };
    return rp(options).then((body) => {
        return body;
    }, (err) => {
        console.log("ERRRRR",err);
        return err;
    });
}