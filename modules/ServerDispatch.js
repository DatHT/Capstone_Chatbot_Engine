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
var postbackHandler = require('./PostbackHandler');
var messageHandler = require('./MessageHandler');
// api client
var app_apiai = apiai(config.API_AI.DEV_ACCESS_TOKEN);
// FB Client
var fbClient = new fbAPIRequest(config.FACEBOOK_TOKEN.FB_PAGE_ACCESS_TOKEN);

// Map to cache user
var userMappingObject = new Map();
const FB_VERIFY_TOKEN = config.FACEBOOK_TOKEN.VERIFY_TOKEN;
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
    console.log('test');
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
                var messageHandlerObject = messageHandler(existUser, userMappingObject);
                handleFacebookMessage(event.message.text, opt, function (response) {
                    // handleAPIResponse(response, existUser);

                    messageHandlerObject.doDispatchingMessage(response);
                });

            }

            // handle postback (bug có thể xay ra bất thình lình)
            // tạo 1 thăng postback handler
            if (event.postback) {
                var jsonObj = JSON.parse(event.postback.payload);
                var postbackHandlerObject = postbackHandler(existUser, userMappingObject);
                postbackHandlerObject.handelPostback(jsonObj);
            }

            // handle log
            if (event.delivery) {
                if (existUser.getResponseAPI().isLog === false) {
                    logHandle(existUser.getSenderID(), existUser.getStatusCode(), existUser.getResponseAPI().response);
                    var tempObj = existUser.getResponseAPI();
                    tempObj.isLog = true;
                    existUser.setResponseAPI(tempObj);
                }
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
                if (type === "location" && existUser.getLocation() === config.LOCATION_AMBIGUITY1) {
                    var url = event.message.attachments[0].url;
                    var param = getURLParam("where1", decodeURIComponent(url));
                    var location = param.split("%2C");

                    geocoding.reverseGeocodingIntoAddres(Number(location[0]), Number(location[1]), function (response) {
                        var tmp = handleGoogleAPIRespnose(response);
                        existUser.setLocation(tmp);
                        var sql;
                        if (existUser.getFood() === config.FOOD_AMBIGUITY1) {
                            sql = 'select * from product_address where addressName regexp "' + existUser.getLocation().toString().trim() + '"';
                        } else {
                            sql = 'select * from product_address where productName regexp "' + existUser.getFood().toString().trim() + '" and addressName regexp "%' + existUser.getLocation().toString().trim() + '" order by rate desc';
                        }
                        util.checkQueryOrCache(existUser, sql);
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

    var intentName = response.result.metadata.intentName;
    if (response.status.code === 200) {
        // greeting
        if (intentName.indexOf(config.INPUT_INTENT_GREETING) > -1) {
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
        if (intentName.indexOf(config.INPUT_INTENT_FOOD_FIRST) > -1) {
            console.log("food first");
            user.setStatusCode(200);
            handleWordProcessingFoodFirst(response, user);
        }

        // location first
        if (intentName.indexOf(config.INPUT_INTENT_LOCATION_FIRST) > -1) {
            console.log("location first");
            user.setStatusCode(200);
            handleWordProcessingLocationFirst(response, user);
        }

        // unknown request
        if (intentName.indexOf(config.INPUT_INTENT_UNKNOWN) > -1) {
            console.log("unknown");
            user.setStatusCode(300);
            handleWordProccessingUnknown(response, user);
        }

        //rating request food in location
        if (intentName.indexOf(config.INPUT_INTENT_RATING_REQUEST_FOOD_IN_LOCATION) > -1) {
            console.log("rating request food in location");
            user.setStatusCode(200);
            handleWordProccessingRatingFoodInLocationRequest(response, user)
        }

        // rating request food no location
        if (intentName.indexOf(config.INPUT_INTENT_RATING_REQUEST_FOOD_NO_LOCATION) > -1) {
            console.log("rating request food no location ");
            user.setStatusCode(200);
            handleWordProcessingRatingFoodNoLocationRequest(response, user);
        }

        //full type request
        if (intentName.indexOf(config.INPUT_INTENT_FULL_TYPE_REQUEST) > -1) {
            console.log("full type request");
            user.setStatusCode(200);
            handleWordProcessingFullTypeRequest(response, user);
        }

        //sensation statement
        if (intentName.indexOf(config.INPUT_INTENT_SENSATION_STATEMENT) > -1) {
            console.log("sensation statement");
            user.setStatusCode(200);
            handleWordProccessingSensationStatements(response, user);
        }

        //refuse statement
        if (intentName.indexOf(config.INPUT_INTENT_REFUSE) > -1) {
            console.log("refuse");
            user.setStatusCode(200);
            handleWordProccessingRefuseStatement(response, user);
        }

        //rating request location
        if (intentName.indexOf(config.INPUT_INTENT_RATING_REQUEST_LOCATION) > -1) {
            console.log("rating request location");
            user.setStatusCode(200);
            handleWordPrcccessingRatingRequestLocationStatement(response, user);
        }
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

    if (action === config.ACTION_RATING_REQUEST_LOCATION) {
        if (splittedText.length > 0 && splittedText.toString().trim() === successMessage) {
            user.setFood(params.Food);
            user.setLocation(config.LOCATION_AMBIGUITY2);
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
                            var structureObj = util.createItemOfStructureResponseForRestaurant(rows[i]);
                            elementArray.push(structureObj);
                        }
                        user.sendFBMessageTypeStructureMessage(elementArray);
                        // nếu lớn hơn 10  thì mới paging
                        if (rows.length > 10) {
                            setTimeout(function () {
                                util.createItemOfStructureButtonNextItem(user.getCurrentPosition(), user);
                                user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn có muốn tiếp tục xem những món mới không :D");
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

    if (action === config.ACTION_REFUSE) {
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

    if (action === config.ACTION_SENSATION_STATEMENT) {
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


    if (action === config.ACTION_CHANGE_LOCATION) {
        // have all
        if (params.Location) {
            user.setLocation(params.Location);
            var sql;
            if (user.getFood() === config.FOOD_AMBIGUITY1) {
                sql = 'select * from product_address where addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
            } else {
                sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
            }

            checkQueryOrCache(user, sql);
        }
    }

    if (action == config.ACTION_CHANGE_FOOD) {
        if (!util.isDefined(user.getFood())) {
            user.setFood(params.Food);
            var elementArray = [{
                type: "postback",
                title: "Chỗ nào gần đây thôi!",
                payload: JSON.stringify({
                    type: "sensation",
                    locationType: config.LOCATION_AMBIGUITY1
                })
            }, {
                type: "postback",
                title: "Chỗ nào ngon là đi!",
                payload: JSON.stringify({
                    type: "sensation",
                    locationType: config.LOCATION_AMBIGUITY2
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

    if (action === config.ACTION_SENSATION_STATEMENT_ACCEPT_ACCEPT_LOCATION) {
        if (splittedText.toString().trim() === successMessage) {
            var sql;
            if (user.getFood().toString().trim().length > 0) {
                user.setLocation(config.LOCATION_AMBIGUITY2);
                sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%"  order by rate desc'
            } else {
                user.setFood(config.FOOD_AMBIGUITY1);
                user.setLocation(config.LOCATION_AMBIGUITY2);
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

    if (action === config.ACTION_FULL_TYPE_REQUEST) {
        if (splittedText.toString().trim() === successMessage) {
            user.setFood(params.Food);
            if (params.Location_Ambiguity && params.Location_Ambiguity === config.LOCATION_AMBIGUITY1) {
                user.setLocation(config.LOCATION_AMBIGUITY1);
                var responseText = "Bạn hãy chia sẽ địa điểm của bạn cho tôi thông qua Facebook Messenger :D";
                user.sendFBMessageTypeText(responseText);
            } else {
                user.setLocation(params.Location);
                if (params.Location_Ambiguity && params.Location_Ambiguity === config.LOCATION_AMBIGUITY2) {
                    user.setLocation(config.LOCATION_AMBIGUITY2)
                    var sql = 'select * from product_address order by rate desc';
                } else if (params.Location) {
                    user.setLocation(params.Location);
                    var sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                }
                checkQueryOrCache(user, sql);
            }
        }
    }

    if (action === config.ACTION_CHANGE_LOCATION) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            if (params.Location) {
                user.setLocation(params.Location);
                sql = 'select * from fproduct_addressood where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                checkQueryOrCache(user, sql);
            }
        }
    }

    if (action == config.ACTION_CHANGE_FOOD) {
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

    if (action === config.ACTION_RATING_REQUEST_FOOD_NO_LOCATION) {
        user.setFood(config.FOOD_AMBIGUITY1);
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

    if (action === config.ACTION_CHANGE_FOOD) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            // clear food
            if (params.Food) {
                user.setFood(params.Food);
                if (user.getFood() === config.FOOD_AMBIGUITY1) {
                    sql = 'select * from product_address where addressName like "%' + user.getLocation().toString().trim() + '%"';
                } else {
                    sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                }
            }
        }
        checkQueryOrCache(user, sql);
    }

    if (action == config.ACTION_CHANGE_LOCATION) {
        user.setLocation(params.Location);
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            var sql;
            if (user.getFood() === config.FOOD_AMBIGUITY1) {
                sql = 'select * from product_address where addressName like "%' + user.getLocation().toString().trim() + '%"';
            } else {
                sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
            }
            checkQueryOrCache(user, sql);
        }
    }
}

//handle response processing rating request food in location
function handleWordProccessingRatingFoodInLocationRequest(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === config.ACTION_RATING_REQUEST_FOOD_IN_LOCATION) {
        if (splittedText.toString().trim() === successMessage) {
            if (params.Location_Ambiguity && params.Location_Ambiguity === config.LOCATION_AMBIGUITY1) {
                user.setLocation(config.LOCATION_AMBIGUITY1);
                var responseText = "Bạn hãy chia sẽ địa điểm của bạn cho tôi thông qua Facebook Messenger :D";
                user.sendFBMessageTypeText(responseText);
            } else {
                var sql;
                user.setFood(config.FOOD_AMBIGUITY1);

                if (params.Location_Ambiguity && params.Location_Ambiguity === config.LOCATION_AMBIGUITY2) {
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

    if (action === config.ACTION_CHANGE_FOOD) {
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

    if (action == config.ACTION_CHANGE_LOCATION) {
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

    if (action === config.ACTION_UNKNOWN) {
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

    if (action === config.ACTION_FIND_LOCATION) {
        var params = response.result.parameters;
        user.setLocation(params.Location);
        if (splittedText.length > 0 && splittedText.toString().trim() !== successMessage) {
            var responseText = 'Bạn thích thưởng thức món gì nào :D';
            var elementArray = util.createItemOfStructureButtonAskForFood();
            user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
        }
    }

    if (action === config.ACTION_FIND_FOOD) {
        if (splittedText.toString().trim() === successMessage) {
            user.setFood(params.Food);
            var sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
            checkQueryOrCache(user, sql);
        }
    }

    if (action === config.ACTION_CHANGE_LOCATION) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            if (params.Location) {
                user.setLocation(params.Location);
                sql = 'select * from fproduct_addressood where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                checkQueryOrCache(user, sql);
            }
        }
    }

    if (action == config.ACTION_CHANGE_FOOD) {
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

    if (action === config.ACTION_FIND_FOOD) {
        user.setFood(params.Food);
        if (splittedText.length > 0 && splittedText.toString().trim() !== successMessage) {
            for (var i = 0; i < splittedText.length; i++) {
                var elementArray = util.createItemOfStructureButtonAskForLocation()
                user.sendFBMessageTypeButtonTemplate(elementArray, splittedText[i]);
            }
        }
    }

    if (action === config.ACTION_FIND_LOCATION) {
        if (splittedText.toString().trim() === successMessage) {
            user.setLocation(params.Location);
            var sql = 'select * from product_address where productName like "%' + user.getFood().trim() + '%" and addressName like "%' + user.getLocation().trim() + '%" order by rate desc';
            checkQueryOrCache(user, sql);
        }
    }

    if (action === config.ACTION_CHANGE_FOOD) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            var sql;
            // clear food
            if (params.Food) {
                user.setFood(params.Food);
                if (user.getLocation().toString().trim() === config.LOCATION_AMBIGUITY2) {
                    sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" order by rate desc';
                } else {
                    user.sendFBMessageTypeText(responseText);
                    sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                    if (user.getLocation().toString().trim() === config.LOCATION_AMBIGUITY2) {
                        sql = 'select * from product_address order by rate desc';
                    }
                }
            }

            // an gi cung dc
            if (params.Food_Ambiguity) {
                user.setFood(config.FOOD_AMBIGUITY1);
                if (user.getLocation().toString().trim() === config.LOCATION_AMBIGUITY2) {
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

    if (action == config.ACTION_CHANGE_LOCATION) {
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            if (params.Location) {
                user.setLocation(params.Location);
                var sql = 'select * from product_address where productName like "%' + user.getFood().toString().trim() + '%" and addressName like "%' + user.getLocation().toString().trim() + '%" order by rate desc';
                checkQueryOrCache(user, sql);
            }
        }
    }
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

