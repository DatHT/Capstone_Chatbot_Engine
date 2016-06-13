/**
 * Created by ThanhTV0612 on 5/17/16.
 */
'use strict'

var apiai = require('apiai');
var uuid = require('node-uuid');
var config = require('../common/app-config').config;

var clientUser = require('./ClientUser');
var fbAPIRequest = require('./FacebookAPI').FacebookAPI;
var databaseConnection = require('./Database');
var util = require('../common/CommonUtil');
var geocoding = require('../lib/GoogleAPI/GMGeocodingAPI');
var logHandle = require('./Logger');

const ACTION_FIND_FOOD = "find.food";
const ACTION_FIND_LOCATION = "find.location";
const ACTION_CHANGE_FOOD = "change.food";
const ACTION_UNKNOWN = "unknown";
const ACTION_CHANGE_LOCATION = "change.location";
const ACTION_RATING_REQUEST_FOOD_IN_LOCATION = "rating.request.food.in.location";
const ACTION_RATING_REQUEST_FOOD_NO_LOCATION = "rating.request.food.no.location";
const ACTION_RATING_REQUEST_FOOD_NO_LOCATION_ACCEPT = "rating.request.food.no.location.accept";
const ACTION_RATING_REQUEST_FOOD_NO_LOCATION_NOT_ACCEPT = "rating.request.food.no.location.not.accept";
const ACTION_RATING_REQUEST_FOOD_NO_LOCATION_NOT_ACCEPT_ANSWER = "rating.request.food.no.location.not.accept.answer";
const ACTION_FULL_TYPE_REQUEST = "full.type.request";
const ACTION_SENSATION_STATEMENT = "sensation.statements";
const ACTION_SENSATION_STATEMENT_ACCEPT = "sensation.statements.accept";
const ACTION_SENSATION_STATEMENT_ACCEPT_ACCEPT_LOCATION = "sensation.statements.accept.acceptlocation";
const ACTION_SENSATION_STATEMENT_ACCEPT_NOTACCEPT_LOCATION = "sensation.statements.accept.notacceptlocation";
const ACTION_SENSATION_STATEMENT_ACCEPT_NOTACCEPT_LOCATION_ANSWER = "sensation.statements.accept.notacceptlocation.answer";
const ACTION_SENSATION_STATEMENT_NOTACCEPT = "sensation.statements.notaccept";
const ACTION_REFUSE = "refuse";
const ACTION_RATING_REQUEST_LOCATION = "rating.request.location";

const successMessage = "success";
const PAYLOAD_LOCATION = "location";
const PAYLOAD_CANCEL = "cancel";
const PAYLOAD_CONTINUE = "continue";
const PAYLOAD_CHANGE = "change";
const PAYLOAD_ASK_LOCATION = "ask_location";
const LOCATION_AMBIGUITY1 = "location_ambiguity1";
const LOCATION_AMBIGUITY2 = "location_ambiguity2";
const FOOD_AMBIGUITY1 = "Food_Ambiguity1";

const INPUT_INTENT_GREETING = "Greeting";
const INPUT_INTENT_FOOD_FIRST = "FoodFirst";
const INPUT_INTENT_LOCATION_FIRST = "LocationFirst";
const INPUT_INTENT_UNKNOWN = "Unknown";
const INPUT_INTENT_RATING_REQUEST_FOOD_IN_LOCATION = "RatingRequestFood_InLocation";
const INPUT_INTENT_RATING_REQUEST_FOOD_NO_LOCATION = "RatingRequestFood_NoLocation";
const INPUT_INTENT_FULL_TYPE_REQUEST = "FullTypeRequest";
const INPUT_INTENT_SENSATION_STATEMENT = "SensationStatement";
const INPUT_INTENT_REFUSE = "Refuse";
const INPUT_INTENT_RATING_REQUEST_LOCATION = "RatingRequestLocation";

const FB_VERIFY_TOKEN = config.FACEBOOK_TOKEN.VERIFY_TOKEN;

var app_apiai = apiai(config.API_AI.DEV_ACCESS_TOKEN);
var fbClient = new fbAPIRequest(config.FACEBOOK_TOKEN.FB_PAGE_ACCESS_TOKEN);
var userMappingObject = new Map();

/*
    Memento Design Pattern
 */
//Care taker
var CareTaker = function () {
    this.mementos = {};

    this.add = function (key, memento) {
        this.mementos[key] = memento;
    }

    this.get = function (key) {
        return this.mementos[key];
    }
}
var caretaker = new CareTaker();

// log helper
var log = (function () {
    var log = "";

    return {
        add: function (msg) {
            log += msg + "\n";
        },
        show: function () {
            // alert(log);
            console.log(log);
            log = "";
        }
    }
})();

// product address
var ProductAddress = function (dataArray) {
    this.dataArray = dataArray;
}

ProductAddress.prototype = {

    hydrate: function () {
        var memento = JSON.stringify(this);
        return memento;
    },

    dehydrate: function (dataArray) {
        var m = JSON.parse(dataArray);
        this.dataArray = m.dataArray;
        return this.dataArray;

    }
}

//express
var express = require('express');
var router = express.Router();
module.exports = router;
router.get('/', function (req, res) {
    if (req.query['hub.verify_token'] == FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
        setTimeout(function () {
            fbClient.doSubscribeRequest();
        }, 3000);
    } else {
        res.send('Error, wrong validation token');
    }
});

router.get('/test', function (req, res) {
    // save state
    caretaker.add(1, mike.hydrate());
    caretaker.add(2, john.hydrate());

    // mess up their names

    mike.name = "King Kong";
    john.name = "Superman";
    // restore original state

    mike.dehydrate(caretaker.get(1));
    john.dehydrate(caretaker.get(2));
    var newPerson = new Person();
    newPerson.dehydrate(caretaker.get(2))

    log.add(newPerson.name);

    log.show();
});

router.post('/', function (req, res) {
    try {
        var messaging_events = req.body.entry[0].messaging;

        for (var i = 0; i < messaging_events.length; i++) {
            var event = req.body.entry[0].messaging[i];
            var sender = event.sender.id;
            // console.log(event);
            // get current user
            var existUser;
            if (!userMappingObject.has(sender)) {
                existUser = clientUser(uuid.v1(), sender);
                userMappingObject.set(sender, existUser);
            } else {
                existUser = userMappingObject.get(sender);
            }

            // normal event message
            if (event.message && event.message.text) {
                var opt = {
                    sessionId: existUser.getSessionID()
                };

                handleFacebookMessage(event.message.text, opt, function (response) {
                    handleAPIResponse(response, existUser);
                });

            }

            //handle payload
            if (event.postback) {
                var jsonObj = JSON.parse(event.postback.payload);
                var responseText;

                //user tap cancel
                if (jsonObj.type == PAYLOAD_CANCEL) {
                    console.log("remove current user");
                    userMappingObject.delete(existUser.getSenderID());
                    var responseText = "Cảm ơn bạn đã quan tâm :D";
                    existUser.sendFBMessageTypeText(responseText);
                }

                if (jsonObj.type == PAYLOAD_CONTINUE) {
                    handelPagingItemPostback(jsonObj, existUser);
                }

                if (jsonObj.type === PAYLOAD_LOCATION) {
                    responseText = getLocation(jsonObj.productId, jsonObj.addressId, existUser5.getData());
                    existUser.sendFBMessageTypeText(responseText);
                }

                if (jsonObj.type === PAYLOAD_CHANGE) {
                    handleChangeItemPostback(jsonObj, existUser);
                }

                if (jsonObj.type === PAYLOAD_ASK_LOCATION) {
                    handleAskLocationPostback(jsonObj, existUser);
                }

                if (jsonObj.type === 'ask_food') {
                    handleAskFoodPostback(jsonObj, existUser);
                }

                if (jsonObj.type === 'yes_no') {
                    handleYesNoPostback(jsonObj, existUser);
                }

                if (jsonObj.type === 'sensation') {
                    handleSensationPostback(jsonObj, existUser);
                }
            }

            // handle log
            if (event.delivery) {
                logHandle(existUser.getSenderID(), existUser.getStatusCode(), existUser.getResponseAPI());
            }

            /**
             {attachments: [
                payload: {
                    title: Tran's Location,
                    type: location,
                    url: abc
                }
             ]}
             */
            //handle attachment
            if (event.message && event.message.attachments) {
                var type = event.message.attachments[0].type;
                if (type === "location" && existUser.getLocation() === LOCATION_AMBIGUITY1) {
                    var url = event.message.attachments[0].url;
                    var param = getURLParam("where1", decodeURIComponent(url));
                    var location = param.split("%2C");

                    geocoding.reverseGeocodingIntoAddres(Number(location[0]), Number(location[1]), function (response) {
                        var tmp = handleGoogleAPIRespnose(response);
                        existUser.setLocation(tmp);
                        var sql;
                        if (existUser.getFood() === FOOD_AMBIGUITY1) {
                            sql = 'select * from product_address where addressName like "%' + existUser.getLocation().toString().trim() + '%"';
                        } else {
                            sql = 'select * from product_address where productName like "%' + existUser.getFood().toString().trim() + '%" and addressName like "%' + existUser.getLocation().toString().trim() + '%" order by rate desc';
                        }
                        checkQueryOrCache(user, sql);
                    });
                }
            }
        }
        return res.status(200).json({
            status: "ok"
        });
    } catch (err) {
        console.log("ERROR: " + err);
        return res.status(400).json({
            status: "error",
            error: err
        });
    }
});

// location and price function
function getLocation(productId, addressId, data) {
    for (var i = 0; i < data.length; i++) {
        if (data[i].productId === productId && data[i].addressId === addressId) {
            return "Món " + data[i].productName + " có tại địa chỉ " + data[i].addressName;
        }
    }
    return "Xin lỗi bạn! Hiện tại không có thông tin về địa chỉ!";
}

// parent handle response
function handleFacebookMessage(statements, option, callback) {
    var request = app_apiai.textRequest(statements, option);

    request.on('response', function (response) {
        return callback(response);
    });

    request.on('error', function (error) {
        console.log(error);
    });

    request.end();
}

// handle
function handleAPIResponse(response, user) {
    console.log(response);
    user.setResponseAPI(response);
    var intentName = response.result.metadata.intentName;
    if (response.status.code === 200) {
        // greeting
        if (intentName.indexOf(INPUT_INTENT_GREETING) > -1) {
            user.getSenderInformation(function (response) {
                console.log(response);
                var profile = JSON.parse(response);
                user.setStatusCode(200);
                var responseText = "Chào " + profile.last_name + profile.first_name + "! Tôi có thể giúp gì cho bạn :D";
                var elementArray = [{
                    type: "postback",
                    title: "Tìm món ăn ngon ",
                    payload: JSON.stringify({
                        type: "rating_food",
                        isNext: 1
                    })
                }, {
                    type: "postback",
                    title: "Chọc bot cho vui ",
                    payload: JSON.stringify({
                        type: "cancel",
                    })
                }];
                user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
                var gender = (profile.gender === "male") ? 1 : 0;
                var sql = 'insert into facebookuser values ("' + user.getSenderID() + '","' + profile.first_name + '",' + gender + ',' + 0 + ',"' + profile.last_name + '","' + profile.locale + '")';
                databaseConnection.connectToDatabase(sql, function () {
                    console.log("insert success");
                })
            });
        }

        // food first
        if (intentName.indexOf(INPUT_INTENT_FOOD_FIRST) > -1) {
            console.log("food first");
            user.setStatusCode(200);
            handleWordProcessingFoodFirst(response, user);
        }

        // location first
        if (intentName.indexOf(INPUT_INTENT_LOCATION_FIRST) > -1) {
            console.log("location first");
            user.setStatusCode(200);
            handleWordProcessingLocationFirst(response, user);
        }

        // unknown request
        if (intentName.indexOf(INPUT_INTENT_UNKNOWN) > -1) {
            console.log("unknown");
            user.setStatusCode(300);
            handleWordProccessingUnknown(response, user);
        }

        //rating request food in location
        if (intentName.indexOf(INPUT_INTENT_RATING_REQUEST_FOOD_IN_LOCATION) > -1) {
            console.log("rating request food in location");
            user.setStatusCode(200);
            handleWordProccessingRatingFoodInLocationRequest(response, user)
        }

        // rating request food no location
        if (intentName.indexOf(INPUT_INTENT_RATING_REQUEST_FOOD_NO_LOCATION) > -1) {
            console.log("rating request food no location ");
            user.setStatusCode(200);
            handleWordProcessingRatingFoodNoLocationRequest(response, user);
        }

        //full type request
        if (intentName.indexOf(INPUT_INTENT_FULL_TYPE_REQUEST) > -1) {
            console.log("full type request");
            user.setStatusCode(200);
            handleWordProcessingFullTypeRequest(response, user);
        }

        //sensation statement
        if (intentName.indexOf(INPUT_INTENT_SENSATION_STATEMENT) > -1) {
            console.log("sensation statement");
            user.setStatusCode(200);
            handleWordProccessingSensationStatements(response, user);
        }

        //refuse statement
        if (intentName.indexOf(INPUT_INTENT_REFUSE) > -1) {
            console.log("refuse");
            user.setStatusCode(200);
            handleWordProccessingRefuseStatement(response, user);
        }

        //rating request location
        if (intentName.indexOf(INPUT_INTENT_RATING_REQUEST_LOCATION) > -1) {
            console.log("rating request location");
            user.setStatusCode(200);
            handleWordPrcccessingRatingRequestLocationStatement(response, user);
        }
    }
}

/*
 handle post back
 */
// handel continue query next item  post back
function handelPagingItemPostback(jSonObject, user) {
    var elementArray = [];
    var data = user.getData();
    if (jSonObject.isNext === 1) {
        var temp;

        if (user.getCurrentPosition() + 10 >= data.length) {
            temp = data.length - user.getCurrentPosition();

            for (var i = user.getCurrentPosition(); i < data.length; i++) {
                var structureObj = createItemOfStructureResponseForProduct(data[i]);
                elementArray.push(structureObj);
            }
            user.sendFBMessageTypeStructureMessage(elementArray);
            setTimeout(function () {
                createItemOfStructureButtonNextItem(user.getCurrentPosition(), user);
            }, 5000);

            user.setCurrentPositionItem(user.getCurrentPosition() + temp);
        } else if (user.getCurrentPosition() + 10 < data.length) {
            for (var i = user.getCurrentPosition(); i < user.getCurrentPosition() + 10; i++) {
                var structureObj = createItemOfStructureResponseForProduct(data[i]);
                elementArray.push(structureObj);
            }
            user.sendFBMessageTypeStructureMessage(elementArray);
            setTimeout(function () {
                createItemOfStructureButtonNextItem(user.getCurrentPosition(), user);
            }, 5000);
            user.setCurrentPositionItem(user.getCurrentPosition() + 10);
        }
    }

    if (jSonObject.isNext === 0) {
        var temp;
        if (user.getCurrentPosition() - 10 < 0) {
            temp = user.getCurrentPosition() - 0;
            user.setCurrentPositionItem(0);
            for (var i = user.getCurrentPosition(); i < temp; i++) {
                var structureObj = createItemOfStructureResponseForProduct(data[i]);
                elementArray.push(structureObj);
            }
            user.sendFBMessageTypeStructureMessage(elementArray);
            setTimeout(function () {
                createItemOfStructureButtonNextItem(user.getCurrentPosition(), user);
            }, 5000);
        } else if (user.getCurrentPosition() - 10 >= 0) {
            user.setCurrentPositionItem(user.getCurrentPosition() - 10);

            if (user.getCurrentPosition() - 10 < 0) {
                for (var i = 0; i < existUser.getCurrentPosition(); i) {
                    var structureObj = createItemOfStructureResponseForProduct(data[i]);
                    elementArray.push(structureObj);
                }

            } else if (user.getCurrentPosition() - 10 >= 0) {
                for (var i = user.getCurrentPosition() - 10; i < user.getCurrentPosition(); i++) {
                    var structureObj = createItemOfStructureResponseForProduct(data[i]);
                    elementArray.push(structureObj);
                }
            }

            user.sendFBMessageTypeStructureMessage(elementArray);
            setTimeout(function () {
                createItemOfStructureButtonNextItem(user.getCurrentPosition(), user);
            }, 5000);
        }
    }
}

// handle change post back
function handleChangeItemPostback(jsonObject, user) {
    if (jsonObject.changeType === 'request') {
        var elementArray = createItemOfStructureButtonAskForChange();
        var responseText = 'Bạn muốn đổi món hay đổi địa điểm :D';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }

    if (jsonObject.changeType === 'food') {
        var responseText = 'Bạn có thể cho tôi biết bạn đổi sang món gì được không?'
        user.sendFBMessageTypeText(responseText);
    }

    if (jsonObject.changeType === 'location') {
        var elementArray = createItemOfStructureButtonAskForLocation()
        var responseText = 'Bạn muốn đổi sang địa điểm nào :D ';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }
}

// handle ask location postback
function handleAskLocationPostback(jsonObject, user) {
    var opt = {
        sessionId: user.getSessionID()
    };

    // near my place
    if (jsonObject.locationType === LOCATION_AMBIGUITY1) {
        user.setLocation(LOCATION_AMBIGUITY1);
        sendDummyRequestToApi(LOCATION_AMBIGUITY1, opt, function (response) {
            user.setStatusCode(200);
            user.setResponseAPI(response);
            console.log("send dummy request successfully");
        })
        var responseText = "Bạn hãy chia sẽ địa điểm của bạn cho tôi thông qua Facebook Messenger :D";
        user.sendFBMessageTypeText(responseText);
    }

    // any place
    if (jsonObject.locationType === LOCATION_AMBIGUITY2) {
        user.setLocation(LOCATION_AMBIGUITY2);
        sendDummyRequestToApi(LOCATION_AMBIGUITY2, opt, function (response) {
            user.setStatusCode(200);
            user.setResponseAPI(response);
            console.log("send dummy request successfully");
        });
        var sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" order by rate desc';
        checkQueryOrCache(user, sql)
    }

    if (jsonObject.locationType === 'my_location') {
        var responseText = 'Bạn có thể cho tôi biết bạn muốn ăn ở quận nào được không :D';
        user.sendFBMessageTypeText(responseText);
    }
}

//handle ask food postback
function handleAskFoodPostback(jsonObject, user) {
    var opt = {
        sessionId: user.getSessionID()
    };

    if (jsonObject.foodType === FOOD_AMBIGUITY1) {
        user.setFood(FOOD_AMBIGUITY1);
        sendDummyRequestToApi(FOOD_AMBIGUITY1, opt, function (response) {
            user.setStatusCode(200);
            user.setResponseAPI(response);
            console.log("send dummy request successfully");
        })
        var sql = 'select * from product_address where addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
        checkQueryOrCache(user, sql);
    }

    if (jsonObject.foodType === 'my_food') {
        var responseText = 'Bạn hãy nhập tên món ăn mà bạn muốn ăn :D';
        user.sendFBMessageTypeText(responseText);
    }
}

//handle yes no postback
function handleYesNoPostback(jsonObject, user) {
    var opt = {
        sessionId: user.getSessionID()
    };

    sendDummyRequestToApi(jsonObject.isYes, opt, function (response) {
        if (response) {
            user.setStatusCode(200);
            user.setResponseAPI(response);
            console.log("send dummy request successfully");
        }
    });

    if (jsonObject.isYes === 'no') {
        var sql = 'select * from product_address order by rate desc';
        createStructureResponseQueryFromDatabase(sql, user);
    }

    if (jsonObject.isYes === 'yes') {
        var elementArray = [{
            type: "postback",
            title: "Ăn ở gần đây",
            payload: JSON.stringify({
                type: "ask_location",
                locationType: LOCATION_AMBIGUITY1
            })
        }, {
            type: "postback",
            title: "Chỗ tôi chỉ định",
            payload: JSON.stringify({
                type: "ask_location",
                locationType: "my_location"
            })
        }, {
            type: "postback",
            title: "Thôi no r`! Không ăn nữa đâu",
            payload: JSON.stringify({
                type: "cancel"
            })
        }];
        var responseText = 'Bạn muốn ăn ở gần đây hay chỗ nào cũng đươc :D';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }
}

// handle sensation postback
function handleSensationPostback(jsonObject, user) {
    var opt = {
        sessionId: user.getSessionID()
    };

    if (jsonObject.isYes === 'yes') {
        // var elementArray = createItemOfStructureButtonAskForFood();
        sendDummyRequestToApi(jsonObject.isYes, opt, function (response) {
            if (response) {
                user.setStatusCode(200);
                user.setResponseAPI(response);
                console.log("send dummy request successfully");
            }
        });
        var elementArray = [{
            type: "postback",
            title: "Món gì ngon thì ăn!",
            payload: JSON.stringify({
                type: "sensation",
                foodType: FOOD_AMBIGUITY1
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
        var responseText = 'Bạn muốn ăn món gì nhỉ?';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }

    // near my place
    if (jsonObject.locationType === LOCATION_AMBIGUITY1) {
        user.setLocation(LOCATION_AMBIGUITY1);
        sendDummyRequestToApi(LOCATION_AMBIGUITY1, opt, function (response) {
            user.setStatusCode(200);
            user.setResponseAPI(response);
            console.log("send dummy request successfully");
        })
        var responseText = "Bạn hãy chia sẽ địa điểm của bạn cho tôi thông qua Facebook Messenger :D";
        user.sendFBMessageTypeText(responseText);
    }

    // any place
    if (jsonObject.locationType === LOCATION_AMBIGUITY2) {
        user.setLocation(LOCATION_AMBIGUITY2);
        sendDummyRequestToApi(LOCATION_AMBIGUITY2, opt, function (response) {
            user.setStatusCode(200);
            user.setResponseAPI(response);
            console.log("send dummy request successfully");
        });
        var sql;
        if (user.getFood() === FOOD_AMBIGUITY1) {
            sql = 'select * from product_address order by rate desc';
        } else {
            sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" order by rate desc';
        }
        checkQueryOrCache(user, sql);
    }

    // my location
    if (jsonObject.locationType === 'my_location') {
        var responseText = 'Bạn có thể cho tôi biết bạn muốn ăn ở quận nào được không :D';
        user.sendFBMessageTypeText(responseText);
    }

    // food ambiguity
    if (jsonObject.foodType === FOOD_AMBIGUITY1) {
        user.setFood(FOOD_AMBIGUITY1);
        sendDummyRequestToApi(FOOD_AMBIGUITY1, opt, function (response) {
            if (response) {
                user.setStatusCode(200);
                user.setResponseAPI(response);
                console.log("send dummy request successfully");
            }
        });
        var elementArray = [{
            type: "postback",
            title: "Chỗ nào gần đây thôi!",
            payload: JSON.stringify({
                type: "sensation",
                locationType: LOCATION_AMBIGUITY1
            })
        }, {
            type: "postback",
            title: "Chỗ nào ngon là đi!",
            payload: JSON.stringify({
                type: "sensation",
                locationType: LOCATION_AMBIGUITY2
            })
        }, {
            type: "postback",
            title: "Đê tôi chọn chỗ!",
            payload: JSON.stringify({
                type: "sensation",
                locationType: 'my_location'
            })
        }];
        var responseText = 'Vậy bạn muốn ăn ở gần đây hay ăn đâu cũng được nhỉ :D';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }

    if (jsonObject.foodType === 'my_food') {
        var responseText = 'Xin hãy nhập tên món ăn bạn muốn :D';
        user.sendFBMessageTypeText(responseText);
    }
}

/*
 handle word processing
 */
//handle response processing rating request location
function handleWordPrcccessingRatingRequestLocationStatement(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === ACTION_RATING_REQUEST_LOCATION) {
        if (splittedText.length > 0 && splittedText.toString().trim() === successMessage) {
            user.setFood(params.Food);
            user.setLocation(LOCATION_AMBIGUITY2);
            var setSql = "SET `sql_mode` = '';";
            var querySql = 'SELECT * FROM `product_address` where `productName` like "%' + user.getFood().toString().trim() + '%" group by `restaurantName` order by `rate` desc ';
            var sql = setSql + querySql;
            databaseConnection.queryMultipleSQLStatements(sql, function (rows, err) {
                if (err) {
                    console.log("ERROR DB: " + err.message);
                } else {
                    console.log("quqery success");
                    user.setData(rows);
                    var data = user.getData();
                    if (rows.length > 0) {
                        var elementArray = [];
                        var lengthArray = rows.length >= 10 ? 10 : rows.length;
                        user.setCurrentPositionItem(lengthArray);
                        console.log("position: ", user.getCurrentPosition());
                        for (var i = 0; i < lengthArray; i++) {
                            var structureObj = createItemOfStructureResponseForRestaurant(rows[i]);
                            elementArray.push(structureObj);
                        }
                        user.sendFBMessageTypeStructureMessage(elementArray);
                        // nếu lớn hơn 10  thì mới paging
                        if (rows.length > 10) {
                            setTimeout(function () {
                                createItemOfStructureButtonNextItem(user.getCurrentPosition(), user);
                            }, 5000);
                        }
                    } else {
                        user.setStatusCode(404);
                        var responseText = "Chân thành xin lỗi! Địa điểm bạn tìm hiện tại không có!";
                        user.sendFBMessageTypeText(responseText);
                    }
                }
            });
        }
    }
}

//handle response processing refuse statement
function handleWordProccessingRefuseStatement(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === ACTION_REFUSE) {
        if (splittedText.length > 0 && splittedText.toString().trim() !== successMessage) {
            var responseText = "Vâng cảm ơn bạn rất nhiều :D";
            user.sendFBMessageTypeText(responseText);
        }
    }
}

//handle response processing sensation statement
function handleWordProccessingSensationStatements(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === ACTION_SENSATION_STATEMENT) {
        if (splittedText.length > 0 && splittedText.toString().trim() !== successMessage) {
            for (var i = 0; i < splittedText.length; i++) {
                var elementArray = [{
                    type: "postback",
                    title: "Ừ thì ăn!",
                    payload: JSON.stringify({
                        type: "sensation",
                        isYes: "yes"
                    })
                }, {
                    type: "postback",
                    title: "Thôi không ăn đâu!",
                    payload: JSON.stringify({
                        type: "cancel"
                    })
                }];
                user.sendFBMessageTypeButtonTemplate(elementArray, splittedText[i]);
            }
        }
    }


    if (action === ACTION_CHANGE_LOCATION) {
        // have all
        if (params.Location) {
            user.setLocation(params.Location);
            var sql;
            if (user.getFood() === FOOD_AMBIGUITY1) {
                sql = 'select * from product_address where addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
            } else {
                sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
            }

            checkQueryOrCache(user, sql);
        }
    }

    if (action == ACTION_CHANGE_FOOD) {
        if (!util.isDefined(user.getFood())) {
            user.setFood(params.Food);
            var elementArray = [{
                type: "postback",
                title: "Chỗ nào gần đây thôi!",
                payload: JSON.stringify({
                    type: "sensation",
                    locationType: LOCATION_AMBIGUITY1
                })
            }, {
                type: "postback",
                title: "Chỗ nào ngon là đi!",
                payload: JSON.stringify({
                    type: "sensation",
                    locationType: LOCATION_AMBIGUITY2
                })
            }, {
                type: "postback",
                title: "Đê tôi chọn chỗ!",
                payload: JSON.stringify({
                    type: "sensation",
                    locationType: 'my_location'
                })
            }];
            var responseText = 'Vậy bạn muốn ăn ở gần đây hay ăn đâu cũng được nhỉ :D';
            user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
        } else {
            user.setFood(params.Food);
            var sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
            checkQueryOrCache(user, sql);
        }

    }

    if (action === ACTION_SENSATION_STATEMENT_ACCEPT_ACCEPT_LOCATION) {
        if (splittedText.toString().trim() === successMessage) {
            var sql;
            if (user.getFood().toString().trim().length > 0) {
                user.setLocation(LOCATION_AMBIGUITY2);
                sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%"  order by rate desc'
            } else {
                user.setFood(FOOD_AMBIGUITY1);
                user.setLocation(LOCATION_AMBIGUITY2);
                sql = 'select * from product_address  order by rate desc';
            }
            checkQueryOrCache(user, sql);
        }
    }
}

//handle response processing full type request
function handleWordProcessingFullTypeRequest(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === ACTION_FULL_TYPE_REQUEST) {
        if (splittedText.toString().trim() === successMessage) {
            user.setFood(params.Food);
            if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY1) {
                user.setLocation(LOCATION_AMBIGUITY1);
                var responseText = "Bạn hãy chia sẽ địa điểm của bạn cho tôi thông qua Facebook Messenger :D";
                user.sendFBMessageTypeText(responseText);
            } else {
                user.setLocation(params.Location);
                if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY2) {
                    user.setLocation(LOCATION_AMBIGUITY2)
                    var sql = 'select * from product_address order by rate desc';
                } else if (params.Location) {
                    user.setLocation(params.Location);
                    var sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                }
                checkQueryOrCache(user, sql);
            }
        }
    }

    if (action === ACTION_CHANGE_LOCATION) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            if (params.Location) {
                user.setLocation(params.Location);
                sql = 'select * from fproduct_addressood where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                checkQueryOrCache(user, sql);
            }
        }
    }

    if (action == ACTION_CHANGE_FOOD) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            // clear food
            if (params.Food) {
                user.setFood(params.Food);
                var sql = 'select * from food where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                checkQueryOrCache(user, sql);
            }

        }
    }

}
//handle response processing rating request food no location
function handleWordProcessingRatingFoodNoLocationRequest(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === ACTION_RATING_REQUEST_FOOD_NO_LOCATION) {
        user.setFood(FOOD_AMBIGUITY1);
        for (var i = 0; i < splittedText.length; i++) {
            var elementArray = [{
                type: "postback",
                title: "Có",
                payload: JSON.stringify({
                    type: "yes_no",
                    isYes: "yes"
                })
            }, {
                type: "postback",
                title: "Không",
                payload: JSON.stringify({
                    type: "yes_no",
                    isYes: "no"
                })
            }];
            user.sendFBMessageTypeButtonTemplate(elementArray, splittedText[i]);
        }
    }

    if (action === ACTION_CHANGE_FOOD) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            // clear food
            if (params.Food) {
                user.setFood(params.Food);
                if (user.getFood() === FOOD_AMBIGUITY1) {
                    sql = 'select * from product_address where addressName like "%' + user.getLocation().toString().trim() + '%"';
                } else {
                    sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                }
            }
        }
        checkQueryOrCache(user, sql);
    }

    if (action == ACTION_CHANGE_LOCATION) {
        user.setLocation(params.Location);
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            var sql;
            if (user.getFood() === FOOD_AMBIGUITY1) {
                sql = 'select * from product_address where addressName like "%' + user.getLocation().toString().trim() + '%"';
            } else {
                sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
            }
            checkQueryOrCache(user, sql);
        }
    }
    // //show food rating cao
    // if (action === ACTION_RATING_REQUEST_FOOD_NO_LOCATION_ACCEPT) {
    //     if (splittedText.toString().trim() === successMessage) {
    //         user.setFood(FOOD_AMBIGUITY1);
    //         user.setLocation(LOCATION_AMBIGUITY2);
    //         var sql = 'select * from product_address order by rate desc';
    //         setTimeout(function () {
    //             createStructureResponseQueryFromDatabase(sql, user);
    //         }, 2000);
    //     }
    // }
    //
    // // ko dong y -> hoi
    // if (action === ACTION_RATING_REQUEST_FOOD_NO_LOCATION_NOT_ACCEPT) {
    //     user.setFood(FOOD_AMBIGUITY1);
    //     if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY1) {
    //         user.setLocation(LOCATION_AMBIGUITY1);
    //         var responseText = "Bạn hãy chia sẽ địa điểm của bạn cho tôi thông qua Facebook Messenger :D";
    //         user.sendFBMessageTypeText(responseText);
    //     } else if (params.Location) {
    //         user.sendFBMessageTypeText(responseText);
    //         var sql;
    //         user.setFood(FOOD_AMBIGUITY1);
    //         user.setLocation(params.Location);
    //
    //         sql = 'select * from product_address where addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
    //         setTimeout(function () {
    //             createStructureResponseQueryFromDatabase(sql, user);
    //         }, 2000);
    //     } else {
    //         var responseText = "Bạn có thể cho tôi biết rõ bạn muốn ăn ở đâu";
    //         user.sendFBMessageTypeText(responseText);
    //     }
    // }
    //
    // // user answer -> give location
    // if (action === ACTION_RATING_REQUEST_FOOD_NO_LOCATION_NOT_ACCEPT_ANSWER) {
    //     if (splittedText.toString().trim() === successMessage) {
    //         if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY1) {
    //             user.setLocation(LOCATION_AMBIGUITY1);
    //             var responseText = "Bạn hãy chia sẽ địa điểm của bạn cho tôi thông qua Facebook Messenger :D";
    //             user.sendFBMessageTypeText(responseText);
    //         } else {
    //             user.setLocation(params.Location);
    //             var sql = 'select * from product_address where addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
    //
    //             setTimeout(function () {
    //                 createStructureResponseQueryFromDatabase(sql, user);
    //             }, 2000);
    //         }
    //     }
    // }
}

//handle response processing rating request food in location
function handleWordProccessingRatingFoodInLocationRequest(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === ACTION_RATING_REQUEST_FOOD_IN_LOCATION) {
        if (splittedText.toString().trim() === successMessage) {
            if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY1) {
                user.setLocation(LOCATION_AMBIGUITY1);
                var responseText = "Bạn hãy chia sẽ địa điểm của bạn cho tôi thông qua Facebook Messenger :D";
                user.sendFBMessageTypeText(responseText);
            } else {
                var sql;
                user.setFood(FOOD_AMBIGUITY1);

                if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY2) {
                    user.setLocation(params.Location_Ambiguity);
                    sql = 'select * from product_address order by rate desc';
                } else {
                    user.setLocation(params.Location);
                    sql = 'select * from product_address where addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                }

                checkQueryOrCache(user, sql);
            }
        }
    }

    if (action === ACTION_CHANGE_FOOD) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            // clear food
            if (params.Food) {
                user.setFood(params.Food);
                var sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                checkQueryOrCache(user, sql);
            }
        }
    }

    if (action == ACTION_CHANGE_LOCATION) {
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            user.setLocation(params.Location);
            var sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
            checkQueryOrCache(user, sql);
        }
    }
}

// handle response processing unknown
function handleWordProccessingUnknown(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);

    if (action === ACTION_UNKNOWN) {
        if (splittedText.length > 0 && splittedText.toString().trim() !== successMessage) {
            for (var i = 0; i < splittedText.length; i++) {
                user.sendFBMessageTypeText(splittedText[i]);
            }
        }
    }
}

// handle response processing location first
function handleWordProcessingLocationFirst(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === ACTION_FIND_LOCATION) {
        var params = response.result.parameters;
        user.setLocation(params.Location);
        if (splittedText.length > 0 && splittedText.toString().trim() !== successMessage) {
            var responseText = 'Bạn thích thưởng thức món gì nào :D';
            var elementArray = createItemOfStructureButtonAskForFood();
            user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
        }
    }

    if (action === ACTION_FIND_FOOD) {
        if (splittedText.toString().trim() === successMessage) {
            user.setFood(params.Food);
            var sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
            checkQueryOrCache(user, sql);
        }
    }

    if (action === ACTION_CHANGE_LOCATION) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            if (params.Location) {
                user.setLocation(params.Location);
                sql = 'select * from fproduct_addressood where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                checkQueryOrCache(user, sql);
            }
        }
    }

    if (action == ACTION_CHANGE_FOOD) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            // clear food
            if (params.Food) {
                user.setFood(params.Food);
                var sql = 'select * from food where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                checkQueryOrCache(user, sql);
            }

        }
    }
}

// handle response processing food first
function handleWordProcessingFoodFirst(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === ACTION_FIND_FOOD) {
        user.setFood(params.Food);
        if (splittedText.length > 0 && splittedText.toString().trim() !== successMessage) {
            for (var i = 0; i < splittedText.length; i++) {
                var elementArray = createItemOfStructureButtonAskForLocation()
                user.sendFBMessageTypeButtonTemplate(elementArray, splittedText[i]);
            }
        }
    }

    if (action === ACTION_FIND_LOCATION) {
        if (splittedText.toString().trim() === successMessage) {
            user.setLocation(params.Location);
            var sql = 'select * from product_address where productName like "%' + user.getFood().trim() + '%" and addressName like "%' + user.getLocation().trim() + '%" order by rate desc';
            checkQueryOrCache(user, sql);
        }
    }

    if (action === ACTION_CHANGE_FOOD) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            var sql;
            // clear food
            if (params.Food) {
                user.setFood(params.Food);
                if (user.getLocation().toString().trim() === LOCATION_AMBIGUITY2) {
                    sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" order by rate desc';
                } else {
                    user.sendFBMessageTypeText(responseText);
                    sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                    if (user.getLocation().toString().trim() === LOCATION_AMBIGUITY2) {
                        sql = 'select * from product_address order by rate desc';
                    }
                }
            }

            // an gi cung dc
            if (params.Food_Ambiguity) {
                user.setFood(FOOD_AMBIGUITY1);
                if (user.getLocation().toString().trim() === LOCATION_AMBIGUITY2) {
                    sql = "select * from product_address order by rate desc";
                } else {
                    sql = 'select * from product_address where addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                }
            }

            checkQueryOrCache(user, sql);
        }

        // have food - do not have location
        if (util.isDefined(user.getFood()) && !util.isDefined(user.getLocation())) {
            user.setFood(params.Food);
            var responseText = "Vâng bạn đổi sang món " + user.getFood().toString().trim() + "! Bạn muốn ăn ở đâu?";
            user.sendFBMessageTypeText(responseText);
        }
    }

    if (action == ACTION_CHANGE_LOCATION) {
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            if (params.Location) {
                user.setLocation(params.Location);
                var sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                checkQueryOrCache(user,sql);
            }
        }
    }
}

// create structure response for facebook base on data query from database
function createStructureResponseQueryFromDatabase(sql, user) {
    databaseConnection.connectToDatabase(sql, function (rows, err) {
        if (util.isDefined(err)) {
            return new Error(err);
        } else {
            user.setData(rows);
            var data = user.getData();

            //create cache + add cache
            var key = JSON.stringify({
                food: user.getFood(),
                location: user.getLocation()
            })
            var objProductAdress = new ProductAddress(rows);
            caretaker.add(key, objProductAdress.hydrate());

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
                        createItemOfStructureButtonNextItem(user.getCurrentPosition(), user);
                    }, 5000);
                } else {
                    setTimeout(function () {
                        createItemOfStructureButtonCancelOrChange(user);
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

// do create structure response
function createItemOfStructureResponseForProduct(item) {
    var structureObj = {};
    structureObj.title = item.productName;
    structureObj.image_url = item.thumbpath;
    structureObj.subtitle = "Soft white cotton t-shirt is back in style";

    var buttons = [];
    var button1 = util.createButton("Xem chi tiết", config.BUTTON_TYPE.web_url, item.urlrelate);
    buttons.push(button1);

    var url = 'http://maps.google.com/maps?q=' + item.latitude + ',' + item.longitude;
    var button2 = util.createButton("Xem Google Map", config.BUTTON_TYPE.web_url, url);
    buttons.push(button2);

    var locationObjPostback = {
        productId: item.productId,
        addressId: item.addressId,
        type: "location"
    };
    var button3 = util.createButton("Xem địa chỉ", config.BUTTON_TYPE.postback, JSON.stringify(locationObjPostback));
    buttons.push(button3);
    structureObj.buttons = buttons;

    return structureObj;
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

// get url param location
function getURLParam(name, url) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? null : results[1];
}


// create structure button template
/**
 [{
         type: "web_url",
         url: "https://petersapparel.parseapp.com",
         title: "Show Website"
     },
 {
     type: "postback",
     title: "Start Chatting",
     payload: "USER_DEFINED_PAYLOAD"
 }]
 */
function createItemOfStructureButtonNextItem(position, user) {
    var elementArray;
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
    user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn có muốn tiếp tục xem những món mới không :D");
}

function createItemOfStructureButtonCancelOrChange(user) {
    var elementArray = [{
        type: "postback",
        title: "Thay đổi",
        payload: JSON.stringify({
            type: "change",
            changeType: 'request'
        })
    }];
    user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn muốn thay đổi địa điểm hay món ăn hãy chọn lựa chọn ở dưới :D");
}

function createItemOfStructureButtonAskForChange() {
    var elementArray = [{
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
    return elementArray;
}

function createItemOfStructureButtonAskForLocation() {
    var elementArray = [{
        type: "postback",
        title: "Ăn ở gần đây",
        payload: JSON.stringify({
            type: "ask_location",
            locationType: LOCATION_AMBIGUITY1
        })
    }, {
        type: "postback",
        title: "Ăn ở đâu cũng được",
        payload: JSON.stringify({
            type: "ask_location",
            locationType: LOCATION_AMBIGUITY2
        })
    }, {
        type: "postback",
        title: "Chỗ tôi chỉ định",
        payload: JSON.stringify({
            type: "ask_location",
            locationType: 'my_location'

        })
    }];
    return elementArray;
}

function createItemOfStructureButtonAskForFood() {
    var elementArray = [{
        type: "postback",
        title: "Món gì cũng ăn",
        payload: JSON.stringify({
            type: "ask_food",
            foodType: FOOD_AMBIGUITY1
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
    return elementArray;
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

// request dummy request api
function sendDummyRequestToApi(statements, option, callback) {
    var request = app_apiai.textRequest(statements, option);

    request.on('response', function (response) {
        return callback(response)
    });

    request.on('error', function (error) {
        console.log(error);
    });

    request.end();
}

// query and cache
function checkQueryOrCache(user, sql) {
    var dataQuery = caretaker.get(JSON.stringify({
        food: user.getFood(),
        location: user.getLocation()
    }));
    if (!util.isDefined(dataQuery)) {
        console.log('QUERYYYYYYYYYYYYYYYYY');
        createStructureResponseQueryFromDatabase(sql , user);
    } else {
        console.log('CACHEEEEEEEEEEEEEEEEE');
        var temp = new ProductAddress();
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
                    createItemOfStructureButtonNextItem(user.getCurrentPosition(), user);
                }, 5000);
            } else {
                setTimeout(function () {
                    createItemOfStructureButtonCancelOrChange(user);
                }, 5000);
            }
        }
    }
}
