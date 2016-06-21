/**
 * Created by DatHT on 5/20/2016.
 */
'use strict'
var config = require('../common/app-config').config;
var util = require('./CommonUtil');
var productAddress = require('../model/ProductAddress');
var careTakerModule = require('../modules/CareTaker');
var databaseConnection = require('../modules/Database');
var caretaker = careTakerModule();

module.exports = {
    isDefined: function (obj) {
        return checkIsDefined(obj);
    },

    //handle response to messenger
    splitResponse: function (str) {
        return splitResponse(str);
    },

    /**
     {
         type :"web_url",
             url :"https://petersapparel.parseapp.com/buy_item?item_id=100",
         title :"Buy Item"
     },
     {
         type: "postback",
             title: "Bookmark Item",
         payload: "USER_DEFINED_PAYLOAD_FOR_ITEM100"
     } */
    createButton: function (title, type, optionalString) {
        return createButton(title, type, optionalString);
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

    // create structure response for facebook base on data query from database
    createStructureResponseQueryFromDatabase: function (sql, user) {
        return createStructureResponseQueryFromDatabase(sql, user);
    }
};

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

function checkIsDefined(obj) {
    if (typeof obj == 'undefined') {
        return false;
    }

    if (!obj) {
        return false;
    }

    return obj != null;
}

function createStructureResponseQueryFromDatabase(sql, user) {
    databaseConnection.connectToDatabase(sql, function (rows, err) {
        if (checkIsDefined(err)) {
            return new Error(err);
        } else {
            user.setData(rows);
            var data = user.getData();

            //create cache + add cache
            var key = JSON.stringify({
                food: user.getFood(),
                location: user.getLocation()
            })
            var objProductAddress = productAddress(rows);
            caretaker.add(key, objProductAddress.hydrate());

            // create message
            if (rows.length > 0) {
                var elementArray = [];
                var lengthArray = rows.length >= 10 ? 10 : rows.length;
                user.setCurrentPositionItem(lengthArray);
                for (var i = 0; i < lengthArray; i++) {
                    var structureObj = createItemOfStructureResponseForProduct(rows[i]);
                    elementArray.push(structureObj);
                }
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
            }
        }
    });
}

function createItemOfStructureResponseForRestaurant(item) {
    var structureObj = {};
    structureObj.title = item.restaurantName;
    structureObj.image_url = item.thumbpath;
    structureObj.subtitle = item.addressName;

    var buttons = [];
    var button1 = util.createButton("Xem chi tiết", config.BUTTON_TYPE.web_url, item.urlrelate);
    buttons.push(button1);

    var url = 'http://maps.google.com/maps?q=' + item.latitude + ',' + item.longitude;
    var button2 = util.createButton("Xem Google Map", config.BUTTON_TYPE.web_url, url);
    buttons.push(button2);

    structureObj.buttons = buttons;

    return structureObj;
}

function checkQueryOrCache(user, sql) {
    var dataQuery = caretaker.get(JSON.stringify({
        food: user.getFood(),
        location: user.getLocation()
    }));
    if (!checkIsDefined(dataQuery)) {
        console.log('QUERYYYYYYYYYYYYYYYYY');
        createStructureResponseQueryFromDatabase(sql, user);
    } else {
        console.log('CACHEEEEEEEEEEEEEEEEE');
        var temp = new productAddress();
        var data = temp.dehydrate(dataQuery);
        if (data.length > 0) {
            var elementArray = [];
            var lengthArray = data.length >= 10 ? 10 : data.length;
            user.setCurrentPositionItem(lengthArray);
            for (var i = 0; i < lengthArray; i++) {
                var structureObj = createItemOfStructureResponseForProduct(data[i]);
                elementArray.push(structureObj);
            }
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
            sql = 'select * from product_address where productName like "%' + user.getFood().trim() + '%" and addressName like "%' + user.getLocation().trim() + '%" order by rate desc';
            if (user.getLocation() === config.LOCATION_AMBIGUITY2) {
                sql = 'select * from product_address where productName like "%' + user.getFood().trim() + '%" order by rate desc';
            }
            createStructureResponseQueryFromDatabase(sql, user);
        }
    }
}

function createItemOfStructureButton(type, user) {
    if (checkIsDefined(user)) {
        var position = user.getCurrentPosition() || {};
    }
    var elementArray;
    switch (type) {
        case (config.PAGING_BUTTON):
        {
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
        case (config.CHANGE_BUTTON_TYPE_1):
        {
            elementArray = [{
                type: "postback",
                title: "Thay đôi món ăn",
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
        case (config.CHANGE_BUTTON_TYPE_2):
        {
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
        case (config.ASK_FOOD_BUTTON):
        {
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
        case (config.ASK_FOOD_BUTTON_TYPE_SENSATION):
        {
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
        case (config.ASK_LOCATION_BUTTON):
        {
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

        default:
        {
            console.log('wrong type button');
            break;
        }
    }
    return elementArray;
}

function createItemOfStructureResponseForProduct(item) {
    var structureObj = {};
    structureObj.title = item.productName;
    structureObj.image_url = item.thumbpath;
    structureObj.subtitle = "Soft white cotton t-shirt is back in style";

    var buttons = [];
    var button1 = createButton("Xem chi tiết", config.BUTTON_TYPE.web_url, item.urlrelate);
    buttons.push(button1);

    var url = 'http://maps.google.com/maps?q=' + item.latitude + ',' + item.longitude;
    var button2 = createButton("Xem Google Map", config.BUTTON_TYPE.web_url, url);
    buttons.push(button2);

    var locationObjPostback = {
        productId: item.productId,
        addressId: item.addressId,
        type: "location"
    };
    var button3 = createButton("Xem địa chỉ", config.BUTTON_TYPE.postback, JSON.stringify(locationObjPostback));
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