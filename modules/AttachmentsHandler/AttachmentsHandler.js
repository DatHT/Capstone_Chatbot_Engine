/**
 * Created by ThanhTV0612 on 6/29/16.
 */
'use strict';
var config = require('../../common/app-config').config;
var util = require('../../common/CommonUtil');
var Promise = require('promise');
var googleMapAPI = require('../../lib/GoogleAPI/GoogleMapAPI');
var http = require('https');
var query = require('querystring');


const API_KEY = 'AIzaSyBSevevRg-XyhYMGUnnOTt9_m0EuitrYk0';
const hostname = 'maps.googleapis.com';
const pathDistanceMatrix = '/maps/api/distancematrix/json?';

module.exports = createAttachmentsHandler;

function AttachmentsHandler(user, userMapping) {
    this.user = user;
    this.userMappingObj = userMapping;
}

function createAttachmentsHandler(user, userMapping) {
    if (!util.isDefined(user)) {
        return new Error('lack of current user');
    }
    return new AttachmentsHandler(user, userMapping);
}

AttachmentsHandler.prototype.handlerAttachmentsFromUser = function (event) {
    return handlerAttachmentsFromUser(event, this.user, this.userMappingObj);
};

function handlerAttachmentsFromUser(event, user, userMappingObject) {
    var type = event.message.attachments[0].type;
    if (type === "location" && user.getLocation().name === config.LOCATION_AMBIGUITY1) {
        user.setIsSearchNearby(true);
        var url = event.message.attachments[0].url;
        var param = getURLParam("where1", decodeURIComponent(url));
        // var location = param.split("%2C");
        var location = [10.794107, 106.69584];
        var tmp;
        var res = {};
        handleGetDistrictFromCoordinate(location, user, tmp)
            .then((tmp) => {
                return util.handleQueryNearbyLocation(user, tmp, location);
            })
            .then((products) => {
                var i = 0;
                var jsonArray = [];
                var count = 0;
                var  filteredArray = [];
                while (i < products.length) {
                    var destination = [products[i].latitude, products[i].longitude];
                    getDistanceBetween2Coordinate(location, destination, products, jsonArray, i, function (response) {
                        for (var i = 0; i<response.length; i++) {
                            var item = JSON.parse(response[i]);
                            if (item.value <1500) {
                                console.log(item.value);
                                filteredArray[count] = item.product;
                                count++;
                            }
                        }

                        user.setData(filteredArray);
                        var currentDataArray = [];
                        if (filteredArray.length > 0) {
                            var elementArray = [];
                            var lengthArray = filteredArray.length >= 10 ? 10 : filteredArray.length;
                            user.setCurrentPositionItem(lengthArray);
                            for (var i = 0; i < lengthArray; i++) {
                                currentDataArray[i] = filteredArray[i];
                                var structureObj = util.createItemOfStructureResponseForProduct(filteredArray[i]);
                                elementArray.push(structureObj);
                            }
                            // set current data
                            user.setCurrentData(currentDataArray);

                            // send message
                            user.sendFBMessageTypeStructureMessage(elementArray);
                            // nếu lớn hơn 10  thì mới paging
                            if (filteredArray.length > 10) {
                                setTimeout(function () {
                                    elementArray = util.createItemOfStructureButton(config.PAGING_BUTTON, user);
                                    user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn có muốn tiếp tục xem những món mới không :D");
                                }, 5000);
                            } else {
                                setTimeout(function () {
                                    elementArray = util.createItemOfStructureButton(config.CHANGE_BUTTON_TYPE_2);
                                    user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn muốn thay đổi địa điểm hay món ăn hãy chọn lựa chọn ở dưới :D");
                                }, 5000);
                            }
                        }
                    });

                    var e = new Date().getTime() + (100 / 1000);
                    while (new Date().getTime() <= e) {
                        console.log('sleep');
                    }
                    i++;
                }

            })

    } else {

    }
}

function handleGetDistrictFromCoordinate(location, user, tmp) {
    console.log('get district from coordinate ');
    return new Promise(function (resolve, reject) {
        googleMapAPI.reverseGeocodingIntoAddres(Number(location[0]), Number(location[1]), function (response, error) {
            if (!error) {
                tmp = handleGoogleAPIRespnose(response);
                console.log('LOG: district' + tmp);
                user.setLocation({
                    name: tmp,
                    coordinate: location,
                    type: config.location_type.nearby
                });
                resolve(tmp.toLowerCase());
            } else {
                reject(error);
            }
        });
    })
}

// get url param location
function getURLParam(name, url) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? null : results[1];
}

// handle get location from google api
function handleGoogleAPIRespnose(response) {
    for (var i = 0; i < response.results.length; i++) {
        for (var j = 0; j < response.results[i].types.length; j++) {
            if (response.results[i].types[j] === 'street_address' || response.results[i].types[j] === 'premise' || response.results[i].types[j] === 'route') {
                for (var k = 0; k < response.results[i].address_components.length; k++) {
                    for (var z = 0; z < response.results[i].address_components[k].types.length; z++) {
                        if (response.results[i].address_components[k].types[z] === 'administrative_area_level_2') {
                            return response.results[i].address_components[k].long_name;
                        }
                    }
                }
            }
        }
    }
}


function getDistanceBetween2Coordinate(original, destination, products, jsonArray, count, callback, opt) {
    var data = query.stringify({
        'origins': original[0].toString() + ',' + original[1].toString(),
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