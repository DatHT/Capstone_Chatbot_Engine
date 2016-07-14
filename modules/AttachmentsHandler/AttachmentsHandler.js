/**
 * Created by ThanhTV0612 on 6/29/16.
 */

var config = require('../../common/app-config').config;
var util = require('../../common/CommonUtil');
var Promise = require('promise');
var geocoding = require('../../lib/GoogleAPI/GMGeocodingAPI');

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
        var url = event.message.attachments[0].url;
        var param = getURLParam("where1", decodeURIComponent(url));
        var location = param.split("%2C");

        var tmp;
        handleGetDistrictFromCoordinate(location, user, tmp)
            .then((tmp) => {
                util.handleQueryNearbyLocation(user, tmp, location);
            })

    } else {
        
    }
}

function handleGetDistrictFromCoordinate(location, user, tmp) {
    console.log('get district from coordinate ');
    return new Promise(function (resolve, reject) {
        geocoding.reverseGeocodingIntoAddres(Number(location[0]), Number(location[1]), function (response, error) {
            if (!error) {
                tmp = handleGoogleAPIRespnose(response);
                user.setLocation({
                    name: tmp,
                    coordinate: location,
                    type: config.location_type.nearby
                });
                resolve(tmp);
            } else {
                reject(error);
            }
        })
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