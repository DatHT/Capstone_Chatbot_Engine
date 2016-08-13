/**
 * Created by DatHT on 5/20/2016.
 */
'use strict'
var config = require('../common/app-config').config;
var productAddress = require('../model/ProductAddress');
var careTakerModule = require('./CareTaker');
var databaseConnection = require('../modules/DBManager/Database');
var caretaker = careTakerModule();
var url = require('url');
var googleMapAPI = require('../lib/GoogleAPI/GoogleMapAPI');

module.exports = {
    isDefined: function (obj) {
        return checkIsDefined(obj);
    },

    //handle response to messenger
    splitResponse: function (str) {
        return splitResponse(str);
    },

    // do create structure response
    createItemOfStructureResponseForProduct: function (item) {
        return createItemOfStructureResponseForProduct(item);
    },

    createItemOfStructureButton: function (type, user) {
        return createItemOfStructureButton(type, user);
    },

    createItemOfStructureResponseForRestaurant: function (item) {
        return createItemOfStructureResponseForRestaurant(item);
    },

    // query and cache
    checkQueryOrCache: function (user, sql) {
        return checkQueryOrCache(user, sql);
    },

    handleQueryNearbyLocation: (user, tmp, location) => {
        return handleQueryNearbyLocation(user, tmp, location);
    },

    handleFilteredProductNearbyByGoogleDistanceMatrix: (user, location, products) => {
        return handleFilteredProductNearbyByGoogleDistanceMatrix(user, location, products);
    },
    handleGetDistrictFromCoordinate: (location, user, tmp) => {
        return handleGetDistrictFromCoordinate(location, user, tmp);
    },

    getURLParam: (name, url) => {
        return getURLParam(name, url);
    },

    getProductNearbyLocation: (location, user, tmp) => {
        return getProductNearbyLocation(location, user, tmp);
    },

    setRemoveDataWhenChangeContext(user) {
        return setRemoveDataWhenChangeContext(user);
    },

    createUrl(item) {
        return createUrl(item);
    }
};

// remove data
function setRemoveDataWhenChangeContext(user) {
    delete user.getLocation();
    delete user.getFood();
}

// handle input facebook
function chunkString() {
    var curr = len, prev = 0;

    var output = [];

    while (s[curr]) {
        if (s[curr++] == ' ') {
            output.push(s.substring(prev, curr));
            prev = curr;
            curr += len;
        }
        else {
            var currReverse = curr;
            do {
                if (s.substring(currReverse - 1, currReverse) == ' ') {
                    output.push(s.substring(prev, currReverse));
                    prev = currReverse;
                    curr = currReverse + len;
                    break;
                }
                currReverse--;
            } while (currReverse > prev)
        }
    }
    output.push(s.substr(prev));
    return output;
}
function splitResponse(str) {
    if (str.length <= 320) {
        return [str];
    }

    var result = this.chunkString(str, 300);

    return result;

}

// check is define
function checkIsDefined(obj) {
    if (typeof obj == 'undefined') {
        return false;
    }

    if (!obj) {
        return false;
    }

    return obj != null;
}

// create structure response for restaurant
function createItemOfStructureResponseForRestaurant(item) {
    var structureObj = {};
    structureObj.title = item.restaurantName;
    structureObj.image_url = item.thumbpath;
    structureObj.subtitle = item.addressName;

    var buttons = [];
    var button1 = createButton("Xem chi tiết", config.BUTTON_TYPE.web_url, item.urlrelate);
    buttons.push(button1);

    var url = 'http://maps.google.com/maps?q=' + item.latitude + ',' + item.longitude;
    var button2 = createButton("Xem Google Map", config.BUTTON_TYPE.web_url, url);
    buttons.push(button2);

    var reportObjPostback = {
        itemId: item.productId,
        addressId: item.addressId,
        type: "report"
    };
    var button3 = createButton("Report Sai Cửa Hàng", config.BUTTON_TYPE.postback, JSON.stringify(reportObjPostback));
    buttons.push(button3);

    structureObj.buttons = buttons;

    return structureObj;
}

//create url for product detail
function createUrl(item) {
    var urlObj = {
        protocol: config.HOST.protocol,
        slashes: config.HOST.slashes,
        auth: config.HOST.auth,
        host: config.HOST.host,
        hostname: config.HOST.hostname,
        hash: config.HOST.hash,
        query: item,
        pathname: config.HOST.pathname
    }
    var urlString = url.format(urlObj);
    return urlString
}

// create normarl request query
function createStructureResponseQueryFromDatabase(user, rows, err) {
    if (checkIsDefined(err)) {
        return new Error(err);
    } else {
        user.setData(rows);
        var data = user.getData();
        var currentDataArray = [];

        //create cache + add cache
        var key = JSON.stringify({
            food: user.getFood(),
            location: user.getLocation().name
        });
        var objProductAddress = productAddress(rows);
        caretaker.add(key, objProductAddress.hydrate());

        // create message
        if (rows.length > 0) {
            var elementArray = [];
            var lengthArray = rows.length >= 10 ? 10 : rows.length;
            user.setCurrentPositionItem(lengthArray);
            for (var i = 0; i < lengthArray; i++) {
                currentDataArray[i] = rows[i];
                var structureObj = createItemOfStructureResponseForProduct(rows[i]);
                elementArray.push(structureObj);
            }
            // set current data
            user.setCurrentData(currentDataArray);

            // send message
            user.sendFBMessageTypeStructureMessage(elementArray);
            // nếu lớn hơn 10  thì mới paging
            if (data.length > 10) {
                setTimeout(function () {
                    elementArray = createItemOfStructureButton(config.PAGING_BUTTON, user);
                    user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn có muốn tiếp tục xem những món mới không :D");
                }, 5000);
            } else {
                setTimeout(function () {
                    elementArray = createItemOfStructureButton(config.CHANGE_BUTTON_TYPE_2);
                    user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn muốn thay đổi địa điểm hay món ăn hãy chọn lựa chọn ở dưới :D");
                }, 5000);
            }
        } else {
            user.setStatusCode(404);
            var responseText = "Chân thành xin lỗi! Món ăn bạn tìm hiện tại không có!";
            user.sendFBMessageTypeText(responseText);

            setTimeout(function () {
                elementArray = createItemOfStructureButton(config.CHANGE_BUTTON_TYPE_2);
                user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn muốn thay đổi địa điểm hay món ăn hãy chọn lựa chọn ở dưới :D");
            }, 5000);
        }
    }
}
function checkQueryOrCache(user, queryType) {
    var dataQuery = caretaker.get(JSON.stringify({
        food: user.getFood().trim(),
        location: user.getLocation().name.trim()
    }));
    var option = {
        productName: user.getFood().trim(),
        addressName: user.getLocation().name.trim()
    };
    if (!checkIsDefined(dataQuery)) {
        console.log('QUERYYYYYYYYYYYYYYYYY');
        createQueryData(user, queryType, option);
    } else {
        console.log('CACHEEEEEEEEEEEEEEEEE');
        var temp = new productAddress();
        var data = temp.dehydrate(dataQuery);
        var currentDataArray = [];

        if (data.length > 0) {
            var elementArray = [];
            var lengthArray = data.length >= 10 ? 10 : data.length;
            user.setCurrentPositionItem(lengthArray);
            for (var i = 0; i < lengthArray; i++) {
                currentDataArray[i] = data[i];
                var structureObj = createItemOfStructureResponseForProduct(data[i]);
                elementArray.push(structureObj);
            }
            user.setCurrentData(currentDataArray);
            user.sendFBMessageTypeStructureMessage(elementArray);

            // nếu lớn hơn 10  thì mới paging
            if (data.length > 10) {
                setTimeout(function () {
                    var elementArray = createItemOfStructureButton(config.PAGING_BUTTON, user);
                    user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn có muốn tiếp tục xem những món mới không :D");
                }, 5000);
            } else {
                setTimeout(function () {
                    var elementArray = createItemOfStructureButton(config.CHANGE_BUTTON_TYPE_2);
                    user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn muốn thay đổi địa điểm hay món ăn hãy chọn lựa chọn ở dưới :D");
                }, 5000);
            }
        } else {
            var queryType = config.QUERY_TYPE.FOOD_LOCATION;
            if (user.getLocation().name === config.LOCATION_AMBIGUITY2) {
                queryType = config.QUERY_TYPE.ONLY_FOOD;
            }
            createQueryData(user, queryType, option);
        }
    }
}
function createItemOfStructureButton(type, user) {
    if (checkIsDefined(user)) {
        var position = user.getCurrentPosition() || {};
    }
    var elementArray;
    switch (type) {
        case (config.PAGING_BUTTON): {
            if (position <= 10) {
                elementArray = [{
                    type: "postback",
                    title: "Tiếp",
                    payload: JSON.stringify({
                        type: "continue",
                        isNext: 1
                    })
                }, {
                    type: "postback",
                    title: "Thay đổi",
                    payload: JSON.stringify({
                        type: "change",
                        changeType: 'request'
                    })
                }];
            } else if (position === user.getData().length) {
                elementArray = [{
                    type: "postback",
                    title: "Previous",
                    payload: JSON.stringify({
                        type: "continue",
                        isNext: 0
                    })
                }, {
                    type: "postback",
                    title: "Thay đổi",
                    payload: JSON.stringify({
                        type: "change",
                        changeType: 'request'
                    })
                }];
            } else {
                elementArray = [{
                    type: "postback",
                    title: "Next",
                    payload: JSON.stringify({
                        type: "continue",
                        isNext: 1
                    })
                }, {
                    type: "postback",
                    title: "Trước",
                    payload: JSON.stringify({
                        type: "continue",
                        isNext: 0
                    })
                }, {
                    type: "postback",
                    title: "Thay đổi",
                    payload: JSON.stringify({
                        type: "change",
                        changeType: 'request'
                    })
                }];
            }
            break;
        }
        case (config.CHANGE_BUTTON_TYPE_1): {
            elementArray = [{
                type: "postback",
                title: "Thay đi món ăn",
                payload: JSON.stringify({
                    type: "change",
                    changeType: 'food'
                })
            }, {
                type: "postback",
                title: "Thay đổi địa điểm",
                payload: JSON.stringify({
                    type: "change",
                    changeType: 'location'
                })
            }, {
                type: "postback",
                title: "Cancel",
                payload: JSON.stringify({
                    type: "cancel"
                })
            }];
            break;
        }
        case (config.CHANGE_BUTTON_TYPE_2): {
            elementArray = [{
                type: "postback",
                title: "Thay đổi",
                payload: JSON.stringify({
                    type: "change",
                    changeType: 'request'
                })
            }, {
                type: "postback",
                title: "Cancel",
                payload: JSON.stringify({
                    type: "cancel"
                })
            }];
            break;
        }
        case (config.ASK_FOOD_BUTTON): {
            elementArray = [{
                type: "postback",
                title: "Món gì cũng ăn",
                payload: JSON.stringify({
                    type: "ask_food",
                    foodType: config.FOOD_AMBIGUITY1
                })
            }, {
                type: "postback",
                title: "Để tôi chọn món",
                payload: JSON.stringify({
                    type: "ask_food",
                    foodType: 'my_food'
                })
            }, {
                type: "postback",
                title: "Thôi không ăn đâu!",
                payload: JSON.stringify({
                    type: "cancel"
                })
            }];
            break;
        }
        case (config.ASK_FOOD_BUTTON_TYPE_SENSATION): {
            elementArray = [{
                type: "postback",
                title: "Món gì ngon thì ăn!",
                payload: JSON.stringify({
                    type: "sensation",
                    foodType: config.FOOD_AMBIGUITY1
                })
            }, {
                type: "postback",
                title: "Để tôi tự chọn món",
                payload: JSON.stringify({
                    type: "sensation",
                    foodType: 'my_food'
                })
            }, {
                type: "postback",
                title: "Thôi không ăn đâu!",
                payload: JSON.stringify({
                    type: "cancel"
                })
            }];
            break;
        }
        case (config.ASK_LOCATION_BUTTON): {
            elementArray = [{
                type: "postback",
                title: "Ăn ở gần đây",
                payload: JSON.stringify({
                    type: "ask_location",
                    locationType: config.LOCATION_AMBIGUITY1
                })
            }, {
                type: "postback",
                title: "Ăn ở đâu cũng được",
                payload: JSON.stringify({
                    type: "ask_location",
                    locationType: config.LOCATION_AMBIGUITY2
                })
            }, {
                type: "postback",
                title: "Chỗ tôi chỉ định",
                payload: JSON.stringify({
                    type: "ask_location",
                    locationType: 'my_location'

                })
            }];
            break;
        }
        case (config.YES_NO_BUTTON) : {
            elementArray = [{
                type: "postback",
                title: "OK! Được thôi",
                payload: JSON.stringify({
                    type: "feedback",
                    isAccept: "yes"
                })
            }, {
                type: "postback",
                title: "Thôi!",
                payload: JSON.stringify({
                    type: "feedback",
                    isAccept: 'no'
                })
            }];
            break;
        }
        case (config.MORE_FUNCTION_BUTTON) : {
            elementArray = [
                {
                    type: "postback",
                    title: "Training cho Bot",
                    payload: JSON.stringify({
                        type: "more",
                        typeMore: "training"
                    })
                }
                , {
                    type: "postback",
                    title: "Hướng dẫn",
                    payload: JSON.stringify({
                        type: "more",
                        typeMore: 'guideline_function'
                    })
                }];
            break;
        }
        case (config.GUIDELINE_BUTTON) : {
            elementArray = [{
                type: "postback",
                title: "Hướng dẫn Training",
                payload: JSON.stringify({
                    type: "guideline",
                    typeGuideline: "training"
                })
            }, {
                type: "postback",
                title: "Hướng dẫn phím tắt",
                payload: JSON.stringify({
                    type: "guideline",
                    typeGuideline: 'hotkey'
                })
            }, {
                type: "postback",
                title: "Cancel",
                payload: JSON.stringify({
                    type: "cancel"
                })
            }];
            break;
        }
        case (config.HOTKEY_GUIDELINE_BUTTON) : {
            elementArray = [{
                type: "postback",
                title: "Xem nhanh bản đồ",
                payload: JSON.stringify({
                    type: "hotkey_guideline",
                    hotkeyGuidelineType: "map"
                })
            }, {
                type: "postback",
                title: "Xem tiếp nhanh",
                payload: JSON.stringify({
                    type: "hotkey_guideline",
                    hotkeyGuidelineType: 'paging'
                })
            }, {
                type: "postback",
                title: "Cancel",
                payload: JSON.stringify({
                    type: "cancel"
                })
            }];
            break;
        }
        default: {
            console.log('wrong type button');
            break;
        }
    }
    return elementArray;
}
function createQueryData(user, queryType, option) {
    var productName = (checkIsDefined(option.productName)) ? option.productName : {};
    var addressName = (checkIsDefined(option.addressName)) ? option.addressName : {};
    switch (queryType) {
        case config.QUERY_TYPE.ONLY_FOOD: {
            databaseConnection.getProductWithOnlyProductName(productName, (rows, err) => {
                return createStructureResponseQueryFromDatabase(user, rows, err);
            });
            break;
        }
        case config.QUERY_TYPE.ONLY_LOCATION: {
            databaseConnection.getProductWithOnlyAddressName(addressName, (rows, err) => {
                return createStructureResponseQueryFromDatabase(user, rows, err);
            });
            break;
        }
        case config.QUERY_TYPE.FOOD_LOCATION: {
            databaseConnection.getProductWithProductNameAndAddressName(productName, addressName, (rows, err) => {
                return createStructureResponseQueryFromDatabase(user, rows, err);
            });
            break;
        }
        case config.QUERY_TYPE.NO_FOOD_LOCATION: {
            databaseConnection.getProductWithoutAnything((rows, err) => {
                return createStructureResponseQueryFromDatabase(user, rows, err);
            });
            break;
        }
        default: {
            console.log('ERROR: bug create query not match');
        }
    }
}
function createItemOfStructureResponseForProduct(item) {
    var structureObj = {};
    structureObj.title = item.productName;
    structureObj.image_url = item.thumbpath;
    structureObj.subtitle = item.addressName;

    var buttons = [];
    var urlrelate = createUrl({
        productId: item.productId,
        addressId: item.addressId,
        numOfSearch: item.numOfSearch,
        type: 'link',
        link: item.urlrelate
    });
    console.log(urlrelate);
    var button1 = createButton("Xem chi tiết", config.BUTTON_TYPE.web_url, urlrelate);
    buttons.push(button1);

    var url = 'http://maps.google.com/maps?q=' + item.latitude + ',' + item.longitude;
    var urlMap = createUrl({
        productId: item.productId,
        addressId: item.addressId,
        numOfSearch: item.numOfSearch,
        type: 'link',
        link: url
    });
    var button2 = createButton("Xem Google Map", config.BUTTON_TYPE.web_url, urlMap);
    buttons.push(button2);

    var reportObjPostback = {
        itemId: item.productId,
        addressId: item.addressId,
        type: "report"
    };
    var button3 = createButton("Món này bị sai rồi!", config.BUTTON_TYPE.postback, JSON.stringify(reportObjPostback));
    buttons.push(button3);
    structureObj.buttons = buttons;

    return structureObj;
}

function createButton(title, type, optionalString) {
    var button = {};
    switch (type) {
        case "web_url":
            button.type = type;
            button.url = optionalString;
            button.title = title;
            return button;
        case "postback" :
            button.type = type;
            button.title = title;
            button.payload = optionalString;
            return button;
        default:
            return;
    }
}

// create query nearby
function handleQueryNearbyLocation(user, tmp, location) {
    console.log('location:', tmp);
    var products = [];

    return new Promise(function (resolve, reject) {
        var option = {
            productName: user.getFood().trim().toLocaleLowerCase(),
            addressName: user.getLocation().name.trim().toLocaleLowerCase()
        };
        createQueryNearbyWithType(config.QUERY_TYPE.FOOD_LOCATION, (rows, error) => {
            if (!error) {
                var count = 0;
                var tmpDistance;
                for (var i = 0; i < rows.length; i++) {
                    tmpDistance = getDistanceFromCoordinate(location[0], location[1], rows[i].latitude, rows[i].longitude);
                    if (tmpDistance <= config.maximum_nearby) {
                        products[count] = rows[i];
                        count++;
                    }
                }
                resolve(products);
            } else {
                console.log('ERROR:', error);
            }
        }, option);
    })

}
function createQueryNearbyWithType(queryType, callback, option) {
    var productName = (checkIsDefined(option.productName)) ? option.productName : {};
    var addressName = (checkIsDefined(option.addressName)) ? option.addressName : {};

    switch (queryType) {
        case (config.QUERY_TYPE.FOOD_LOCATION): {
            databaseConnection.getProductNearbyWithProductNameAndAddressName(productName, addressName, (rows, err) => {
                return callback(rows, err);
            });
            break;
        }
        case (config.QUERY_TYPE.ONLY_LOCATION): {
            databaseConnection.getProductNearbyWithOnlyAddressname(addressName, (rows, err) => {
                return callback(rows, err);
            });
            break;
        }
    }
}
function getDistanceFromCoordinate(latitude1, longitude1, latitude2, longitude2) {
    function toRad(x) {
        return x * Math.PI / 180;
    }

    var lon1 = longitude1;
    var lat1 = latitude1;

    var lon2 = longitude2;
    var lat2 = latitude2;

    var R = 6371; // km

    var x1 = lat2 - lat1;
    var dLat = toRad(x1);
    var x2 = lon2 - lon1;
    var dLon = toRad(x2)
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d;
}
function handleFilteredProductNearbyByGoogleDistanceMatrix(user, location, products) {
    var i = 0;
    var jsonArray = [];
    var count = 0;
    var filteredArray = [];
    while (i < products.length) {
        var destination = [products[i].latitude, products[i].longitude];
        var original = [];

        googleMapAPI.getDistanceBetween2Coordinate(location, destination, products, jsonArray, i, function (response) {
            for (var i = 0; i < response.length; i++) {
                var item = JSON.parse(response[i]);
                if (item.value < 2000) {
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
                    var structureObj = createItemOfStructureResponseForProduct(filteredArray[i]);
                    elementArray.push(structureObj);
                }
                // set current data
                user.setCurrentData(currentDataArray);

                // send message
                user.sendFBMessageTypeStructureMessage(elementArray);
                // nếu lớn hơn 10  thì mới paging
                if (filteredArray.length > 10) {
                    setTimeout(function () {
                        elementArray = createItemOfStructureButton(config.PAGING_BUTTON, user);
                        user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn có muốn tiếp tục xem những món mới không :D");
                    }, 5000);
                } else {
                    setTimeout(function () {
                        elementArray = createItemOfStructureButton(config.CHANGE_BUTTON_TYPE_2);
                        user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn muốn thay đổi địa điểm hay món ăn hãy chọn lựa chọn ở dưới :D");
                    }, 5000);
                }
            } else  {
                user.setStatusCode(404);
                var responseText = "Chân thành xin lỗi! Món ăn bạn tìm hiện tại không có!";
                user.sendFBMessageTypeText(responseText);

                setTimeout(function () {
                    var elementArray = createItemOfStructureButton(config.CHANGE_BUTTON_TYPE_2);
                    user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn muốn thay đổi địa điểm hay món ăn hãy chọn lựa chọn ở dưới :D");
                }, 5000);
            }
        });

        var e = new Date().getTime() + (100 / 1000);
        while (new Date().getTime() <= e) {
            console.log('sleep');
        }
        i++;
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
function getProductNearbyLocation(location, user, tmp) {
    handleGetDistrictFromCoordinate(location, user, tmp)
        .then((tmp) => {
            return handleQueryNearbyLocation(user, tmp, location);
        })
        .then((products) => {
            if (products.length > 0) {
                handleFilteredProductNearbyByGoogleDistanceMatrix(user, location, products);
            } else {
                user.setStatusCode(404);
                var responseText = "Chân thành xin lỗi! Món ăn bạn tìm hiện tại không có!";
                user.sendFBMessageTypeText(responseText);

                setTimeout(function () {
                    var elementArray = createItemOfStructureButton(config.CHANGE_BUTTON_TYPE_2);
                    user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn muốn thay đổi địa điểm hay món ăn hãy chọn lựa chọn ở dưới :D");
                }, 5000);
            }
        })
}