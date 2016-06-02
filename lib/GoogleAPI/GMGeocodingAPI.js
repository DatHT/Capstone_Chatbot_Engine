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

// module.exports = (latlng, callback, opt) => {
//     var bounds = '10.782325,106.7061527|10.7712356,106.6945839';
//     var data = query.stringify({
//         'latlng': latlng,
//         'key': API_KEY
//     });
//     var options = opt || {};
//     options.hostname = hostname;
//     options.path = path + data;
//     // options.region = options.region || regionVN;
//     options.method = 'POST';
//
//     var req = http.request(options);
//     req.on('error', (e) => {
//         console.log('problem with request: ${e.message}');
//     });
//     req.on('response', function(response) {
//         "use strict";
//         var result = '';
//         response.on('data', (chunk) => {
//             result += chunk;
//         });
//         response.on('end', () => {
//             callback(result);
//         })
//     });
//
//     req.write(data);
//     console.log(req);
//     req.end();
// };

module.exports =  {
    reverseGeocodingIntoAddres: function (lat, long, callback, opt) {
        var data = query.stringify({
            'latlng' : lat.toString() + ',' + long.toString(),
            'key' : API_KEY
        });

        var  option = opt || {};
        option.hostname = hostname;
        option.path = path + data;
        option.method = 'POST';

        var request = http.request(option, function(response) {
            var body = '';

            response.on('data', function(chunk) {
                body += chunk;
            });

            response.on('end', function() {
                if (response.statusCode >= 200 && response.statusCode <= 299) {
                    try {
                        callback(JSON.parse(body));
                    } catch (error) {
                        console.log('error', error);
                    }
                } else {
                    var error = 'Server response error with status code: ' + response.statusCode + '\n' + body;
                    self.emit('error', error);
                }
            });
        });

        request.on('error', function(error) {
            console.log('problem with request:', error);
        });
        request.write(data);
        request.end();
    }
}