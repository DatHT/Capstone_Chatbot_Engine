/**
 * Created by HuyTCM on 5/18/16.
 */
"use strict";

var http = require('https');
var query = require('querystring');

const API_KEY = 'AIzaSyDWwd5Yd1b5eDBkXS_hOBtpd2KxlK-ABnQ';
const hostname = 'maps.googleapis.com';
const pathLocation = '/maps/api/geocode/json?';
const pathDistanceMatrix = '/maps/api/distancematrix/json?';
const pathGoogleStaticMap = '/maps/api/staticmap?';


module.exports = {
    reverseGeocodingIntoAddres: (lat, long, callback, opt) =>{
        var data = query.stringify({
            'latlng': lat.toString() + ',' + long.toString(),
            'key': API_KEY
        });

        var option = opt || {};
        option.hostname = hostname;
        option.path = pathLocation + data;
        option.method = 'POST';

        var request = http.request(option, function (response) {
            var body = '';

            response.on('data', function (chunk) {
                body += chunk;
            });

            response.on('end', function () {
                if (response.statusCode >= 200 && response.statusCode <= 299) {
                    try {
                        callback(JSON.parse(body), null);
                    } catch (error) {
                        console.log('error', error);
                    }
                } else {
                    var error = 'Server response error with status code: ' + response.statusCode + '\n' + body;
                    callback(null, error);
                    // self.emit('error', error);
                }
            });
        });

        request.on('error', function (error) {
            console.log('problem with request:', error);
        });
        request.write(data);
        request.end();
    },

    getStaticGoogleMap:  (lat, long, callback, opt) => {
        var data = query.stringify({
            'zoom': 14,
            'maptype': 'roadmap',
            'size' : '600x300',
            'markers': 'label:red|label:S|' + lat.toString() + ',' + long.toString(),
            'key': API_KEY
        });

        var option = opt || {};
        option.hostname = hostname;
        option.path = pathGoogleStaticMap + data;
        option.method = 'GET';

        var request = http.request(option, function (response) {
            var body = '';
            response.setEncoding('binary');

            response.on('data', function (chunk) {
                body += chunk;
            });

            response.on('end', function () {
                if (response.statusCode >= 200 && response.statusCode <= 299) {
                    try {
                        callback(body, null);
                    } catch (error) {
                        console.log('error', error);
                    }
                } else {
                    var error = 'Server response error with status code: ' + response.statusCode + '\n' + body;
                    callback(null, error);
                    // self.emit('error', error);
                }
            });
        });

        request.on('error', function (error) {
            console.log('problem with request:', error);
        });
        request.write(data);
        request.end();
    },

    getDistanceFromDistanceMatrix: (original, matrix, callback, opt) => {
        console.log("get distance matrix");
        var destinations = createQueryDestination(matrix);
        var data = query.stringify({
            'origins': original[0].toString() + ',' + original[1].toString(),
            'units': 'imperial',
            'destinations' : destinations,
            'key': API_KEY
        });

        var option = opt || {};
        option.hostname = hostname;
        option.path = pathDistanceMatrix + data;
        option.method = 'POST';
        console.log(option.hostname + option.path);

        var request = http.request(option, function (response) {
            var body = '';

            response.on('data', function (chunk) {
                body += chunk;
            });

            response.on('end', function () {
                if (response.statusCode >= 200 && response.statusCode <= 299) {
                    try {
                        callback(JSON.parse(body), null);
                    } catch (error) {
                        console.log('error', error);
                    }
                } else {
                    var error = 'Server response error with status code: ' + response.statusCode + '\n' + body;
                    callback(null, error);
                    // self.emit('error', error);
                }
            });
        });

        request.on('error', function (error) {
            console.log('problem with request:', error);
        });
        request.write(data);
        request.end();
    },

    getDistanceBetween2Coordinate:  (original, destination, products, jsonArray, count, callback, opt) => {
    var data = query.stringify({
        'origins': original[0] + ',' + original[1],
        'destinations': destination[0].toString() + ',' + destination[1].toString(),
        'key': API_KEY
    });

    var option = opt || {};

    option.hostname = hostname;
    option.path = pathDistanceMatrix + data;
    option.method = 'GET';

    var body = {
        product: products[count],
        value: 0
    };

    var request = http.request(option, function (response) {
        var bodyResponse = '';

        response.on('data', function (chunk) {
            bodyResponse += chunk;
            var jsonRepsonse = JSON.parse(bodyResponse);
            body.value = jsonRepsonse.rows[0].elements[0].distance.value;
            jsonArray.push(JSON.stringify(body));
        });

        response.on('end', function () {
            if (products.length === jsonArray.length) {
                callback(jsonArray);
            }
        });
    });

    request.on('error', function (error) {
        console.log('problem with request:', error);
    });
    request.write(data);
    request.end();
}
};

function createQueryDestination(matrix) {
    var destination = '';
    for (var i = 0; i < matrix.length; i++) {
        destination +=  matrix[i][0] + ',' + matrix[i][1];
        if (i < matrix.length-1) {
            destination += '|';
        }
    }
    return destination;
}