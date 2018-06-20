
// Just a useful check if the right environment variables are set,
// if not, tell the user

// Run this command to test the nodejs layer:
// JIRA_API_TOKEN=xxx JIRA_ORGANISATION_DOMAIN=xxx  node server.js

let requiredEnvironmentVariables = [
    'JIRA_API_TOKEN',
    'JIRA_ORGANISATION_DOMAIN'
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
    logstash_port_1 = process.env.LOGSTASH_PORT_1 || 8051,
    logstash_port_2 = process.env.LOGSTASH_PORT_2 || 8052,
    port = process.env.PORT || 3000,
    jira_api_token = process.env.JIRA_API_TOKEN,
    jira_org_url = process.env.JIRA_ORGANISATION_DOMAIN;

app.listen(port, () => {
    console.log('Environment variable PORT is: ' + port);
    console.log('Environment variables LOGSTASH_NAME is: ' + logstash_name);
});



app.get('/projects', (req, res) => {
    let url = "https://"+jira_org_url+"/rest/api/2/project";
    let authtoken = jira_api_token;
    getData(url, authtoken)
        .then((data) => {
            return postData("http://"+logstash_name+":"+logstash_port_1, data)
        })
        .then((data) => {
            res.send(data);
        })
            .catch((err) => {
                res.send(err);
            });
});



app.get('/users', (req, res) => {
    let url = "https://"+jira_org_url+"/rest/api/2/user/search/?username=%25&maxResults=2000";
    let authtoken = jira_api_token;
    getData(url, authtoken)
        .then((data) => {
            return postData("http://"+logstash_name+":"+logstash_port_2, data)
        })
        .then((data) => {
            res.send(data);
        })
            .catch((err) => {
                res.send(err);
            });
});



function getData(url, authtoken) {
    // Note, the auth token in this case is a base64 string of the syntax: "username:password"
    let headers = {
        'User-Agent': 'request',
        'Authorization' : 'Basic '+ authtoken,
        'Content-Type': 'application/json'
    };
    let options = {url, headers};
    return rp(options).then((data) => {
        console.log("getData result: data", data);
        return data;
    });

}



function postData(url, sendlogstash_data) {

    if (sendlogstash_data === undefined) {
        console.log("No logdashdata to send.");
        return;
    }

    let headers = {
        "Content-Type": "application/json"
    };
    
    let options = {
        method: "POST",
        body: JSON.parse(sendlogstash_data),
        url, 
        headers,
        json: true
    };

    return rp(options).then((body) => {
        // Send back the data for logstash so you can see what was sent
        return sendlogstash_data;
    });

}