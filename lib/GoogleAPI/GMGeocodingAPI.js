/**
 * Created by HuyTCM on 5/18/16.
 */
"use strict";

var http = require('https');
var query = require('querystring');

const API_KEY = 'AIzaSyC-kLxymmWloRmvdJZ99rz_6n_PbpEeoqg';
const hostname = 'maps.googleapis.com';
const path = '/maps/api/geocode/json?';
const regionVN = 'vn';

module.exports = (addressStr, callback, opt) => {
    var bounds = '10.782325,106.7061527|10.7712356,106.6945839';
    var data = query.stringify({
        'address': addressStr,
        'key': API_KEY
    });
    var options = opt || {};
    options.hostname = hostname;
    options.path = path + data;
    // options.region = options.region || regionVN;
    options.method = 'POST';

    var req = http.request(options);
    req.on('error', (e) => {
        console.log(`problem with request: ${e.message}`);
    });
    req.on('response', function(response) {
        "use strict";
        var result = '';
        response.on('data', (chunk) => {
            result += chunk;
        });
        response.on('end', () => {
            callback(result);
        })
    });

    req.write(data);
    console.log(req);
    req.end();
};