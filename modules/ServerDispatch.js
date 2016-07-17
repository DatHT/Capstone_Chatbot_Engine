/**
 * Created by ThanhTV0612 on 5/17/16.
 */
'use strict'



var config = require('../common/app-config').config;
var fbAPIRequest = require('./../common/FacebookAPI').FacebookAPI;
var url = require('url');
var fbMessageHandler = require('./FacebookHandler/FacebookMessageHandler');
var userMappingObject = new Map();
// FB Client
var fbClient = new fbAPIRequest(config.FACEBOOK_TOKEN.FB_PAGE_ACCESS_TOKEN);

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
            fbClient.createGetStartButton(function () {
                console.log('create start button successfully');
            });
            fbClient.createGreetingText(function () {
                console.log('create greeting message successfully');
            });
            fbClient.createPersistentMenu(function () {
                console.log('create persistent menu successfully');
            });
        }, 3000);
    } else {
        res.send('Error, wrong validation token');
    }
});

router.get('/test', function (req, res) {
    // doSomething()
    //     .then(function (result) {
    //         console.log(result);
    //         return doSomthingElse();
    //     })
    //     .then(function (anotherPromise) {
    //         console.log("the final result is", anotherPromise);
    //     });

});

function doSomthingElse() {
    return new Promise(function (resolve) {
        var value = 50;
        setTimeout(() => {
            resolve(value);
        }, 2000);
    });
}

function doSomething() {
    return new Promise(function (resolve) {
        var value = 42;
        // setTimeout(() => {
        resolve(value);
        // }, 2000);
    });
}

function Promise(fn) {
    var state = 'pending';
    var value;
    var deferred = null;

    function resolve(newValue) {
        if (newValue && typeof newValue.then === 'function') {
            newValue.then(resolve, reject);
            return;
        }
        state = 'resolved';
        value = newValue;

        if (deferred) {
            handle(deferred);
        }
    }

    function reject(reason) {
        state = 'rejected';
        value = reason;

        if (deferred) {
            handle(deferred);
        }
    }

    function handle(handler) {
        if (state === 'pending') {
            deferred = handler;
            return;
        }

        var handlerCallback;

        if (state === 'resolved') {
            handlerCallback = handler.onResolved;
        } else {
            handlerCallback = handler.onRejected;
        }

        if (!handlerCallback) {
            if (state === 'resolved') {
                handler.resolve(value);
            } else {
                handler.reject(value);
            }

            return;
        }

        var ret = handlerCallback(value);
        handler.resolve(ret);
    }

    this.then = function (onResolved, onRejected) {
        return new Promise(function (resolve, reject) {
            handle({
                onResolved: onResolved,
                onRejected: onRejected,
                resolve: resolve,
                reject: reject
            });
        });
    };

    fn(resolve, reject);
}

router.get('/test1', function (req, res) {
    res.redirect('http://google.com');
});


router.post('/', function (req, res) {
    try {
        var fbMessageHandlerObject = fbMessageHandler();
        fbMessageHandlerObject.handleFacebookMessageFromUser(req, userMappingObject);

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







