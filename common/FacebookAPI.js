/**
 * Created by ThanhTV0612 on 5/18/16.
 */
'use strict';
const request = require('request');
// var util = require('util');

var pageAccessToken;
function FacebookAPI(fbPageAccessToken) {
    pageAccessToken = fbPageAccessToken;
}

function createFacebookClient(fbPageAccessToken) {
    if (fbPageAccessToken.length === 0) {
        throw new Error('Facebook Page Access Token Empty');
    }

    return new FacebookAPI(fbPageAccessToken);
}

exports.FacebookAPI = createFacebookClient;

FacebookAPI.prototype.sendFBMessageTypeText = function (sender, messageData) {
    return sendFBMessageTypeText(sender, messageData);
};

FacebookAPI.prototype.doSubscribeRequest = function () {
    return doSubscribeRequest();
};

FacebookAPI.prototype.sendFBMessageTypeImage = function (sender, urlString) {
    return sendFBMessageTypeImage(sender, urlString);
};

FacebookAPI.prototype.sendFBMessageTypeImageFile = function (sender, urlImageFile) {
    return sendFBMessageTypeImageFile(sender,urlImageFile);
};

FacebookAPI.prototype.sendFBMessageTypeButtonTemplate = function (sender, buttonArray, responseText) {
    return sendFBMessageTypeButtonTemplate(sender, buttonArray, responseText);
};

FacebookAPI.prototype.sendFBMessageTypeStructureMessage = function (sender, elementArray) {
    return sendFBMessageTypeStructureMessage(sender, elementArray);
};

FacebookAPI.prototype.sendWelcomeMessage = function (sender) {
    return sendWelcomeMessage(sender);
};

FacebookAPI.prototype.getSenderInformation = function (sender, callback) {
    return getSenderInformation(sender, callback);
};

FacebookAPI.prototype.sendFBMessageTypeStructureMessageIncludeMessage= function (sender, elementArray ,responseText) {
    return sendFBMessageTypeStructureMessageIncludeMessage(sender, elementArray ,responseText);
};

FacebookAPI.prototype.createGetStartButton = function (callback) {
    return createGetStartButton(callback);
};

FacebookAPI.prototype.createGreetingText = function (callback) {
    return createGreetingText(callback);
};

FacebookAPI.prototype.createPersistentMenu = function (callback) {
    return createPersistentMenu(callback);
};

FacebookAPI.prototype.sendFBQuickReplyMessage = function (sender, elementArray, quickReplyArray) {
    return sendFBQuickReplyMessage(sender, elementArray, quickReplyArray);
};

function sendFBMessageTypeText(sender, messageData) {
    console.log("do send text message");
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: pageAccessToken},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: {text: messageData}
        },
        timeout: 20000
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error Text: ', response.body.error);
        }
        if (response) {
            console.log('response ok successfully');
        }

    });
}

function doSubscribeRequest() {
    console.log("do subcribes");
    request({
            method: 'POST',
            timeout: 20000,
            uri: "https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=" + pageAccessToken
        },
        function (error, response, body) {
            if (error) {
                console.error('Error while subscription: ', error);
            } else {
                console.log('Subscription result: ', response.body);
            }
            if (response) {
                console.log('response ok successfully');
            }

        })
}

function sendFBMessageTypeImage(sender, urlString) {
    console.log("URL: ", urlString);
    request({
        timeout: 20000,
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: pageAccessToken},
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: urlString
                    }
                }
            }
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: Image ', response.body.error);
        }
        if (response) {
            console.log('response ok successfully');
        }

    })
}

function sendFBMessageTypeImageFile(sender, urlImageFile) {
    console.log("do send image file message");
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: pageAccessToken},
        method: 'POST',
        json: {
            timeout: 20000,
            recipient: {
                id: sender
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {}
                }
            },
            filedata: urlImageFile
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error Image File: ', response.body.error);
        }
        if (response) {
            console.log('response ok successfully');
        }

    })
}

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
// send fb message type button template
function sendFBMessageTypeButtonTemplate(sender, buttonArray, responseText) {
    console.log("do send button template message");
    request({
        timeout: 20000,
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: pageAccessToken},
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: responseText,
                        buttons: buttonArray
                    }
                }
            }
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error Button Template: ', response.body.error);
        }
        if (response) {
            console.log('response ok successfully');
        }

    });
}

/**
 [{
        title: "Classic White T-Shirt",
        image_url: "http://petersapparel.parseapp.com/img/item100-thumb.png",
        subtitle: "Soft white cotton t-shirt is back in style",
        buttons:[
            {
                type: "web_url",
                url: "https://petersapparel.parseapp.com/view_item?item_id=100",
                title: "View Item"
            },
            {
                type :"web_url",
                url :"https://petersapparel.parseapp.com/buy_item?item_id=100",
                title :"Buy Item"
            },
            {
                type: "postback",
                title: "Bookmark Item",
                payload: "USER_DEFINED_PAYLOAD_FOR_ITEM100"
            }
        ]
    }] **/
//send fb message type structure message
function sendFBMessageTypeStructureMessage(sender,elementArray) {
    console.log("do send structure message");
    request({
        timeout: 20000,
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: pageAccessToken},
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: elementArray
                    }
                }
            }
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error Structure Message: ', response.body.error);
        }
        if (response) {
            console.log('response ok successfully');
        }
    });
}

function sendFBMessageTypeStructureMessageIncludeMessage(sender,elementArray, responseText) {
    console.log("do send structure message");
    request({
        timeout: 20000,
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: pageAccessToken},
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: elementArray

                    }
                }
            }
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error Structure Message: ', response.body.error);
        }
        if (response) {
            console.log('response ok successfully');
        }
    });
}

//send welcome message
function sendWelcomeMessage(sender) {
    console.log("send welcome message");
    request({
        timeout: 20000,
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: pageAccessToken},
        method: 'POST',
        json: {
            setting_type : "greeting",
            message: {
                text: "chào mừng bạn đến với chat bot thông minh, bạn thích ăn món gì, ở đâu?"
            }
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        if (response) {
            console.log('response ok successfully');
        }
    });
}

//send get sender information
function getSenderInformation(sender, callback) {
    console.log("send welcome message");
    request({
        timeout: 20000,
        url: 'https://graph.facebook.com/v2.6/' + sender +'/',
        qs: {
            access_token: pageAccessToken,
            fields: 'first_name,last_name,profile_pic,locale,timezone,gender'
        },
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error Sender Information: ', response.body.error);
        } else {
            return callback(body);
        }
        if (response) {
            console.log('response ok successfully');
        }

    });
}

//create greeting text
function createGetStartButton(callback) {
    console.log("create get start button");
    request({
        timeout: 20000,
        url: 'https://graph.facebook.com/v2.6/me/thread_settings',
        qs: {
            access_token: pageAccessToken
        },
        json: {
            setting_type: "call_to_actions",
            thread_state: "new_thread",
            call_to_actions:[
                {
                    payload :"get_start"
                }
            ]
        },
        method: 'POST'
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error Sender Information: ', response.body.error);
        } else {
            return callback(body);
        }
        if (response) {
            console.log('response ok successfully');
        }
    });
}

//create greeting text
function createGreetingText(callback) {
    console.log("create greeting text");
    request({
        timeout: 20000,
        url: 'https://graph.facebook.com/v2.6/me/thread_settings',
        qs: {
            access_token: pageAccessToken
        },
        json: {
            setting_type:"greeting",
            greeting: {
                text: "Welcome to My Company!"
            }
        },
        method: 'POST'
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error Sender Information: ', response.body.error);
        } else {
            return callback(body);
        }
        if (response) {
            console.log('response ok successfully');
        }
    });
}

//persistent menu
function createPersistentMenu(callback) {
    console.log('create persistent menu');
    request({
        timeout: 20000,
        url: 'https://graph.facebook.com/v2.6/me/thread_settings',
        qs: {
            access_token: pageAccessToken
        },
        json: {
            setting_type : "call_to_actions",
            thread_state : "existing_thread",
            call_to_actions:[
                {
                    type : "postback",
                    title : "Món ăn xu hướng mới",
                    payload : JSON.stringify({
                        type: "trend",
                        typeTrend: "food"})
                },
                {
                    type : "postback",
                    title : "Quán được nổi nhất",
                    payload : JSON.stringify({
                        type: "trend",
                        typeTrend: "location"})
                },
                {
                    type: "postback",
                    title: "Training cho Bot",
                    payload: JSON.stringify({
                        type: "more",
                        typeMore: "training"
                    })
                },
                {
                    type: "postback",
                    title: "Hướng dẫn",
                    payload: JSON.stringify({
                        type: "more",
                        typeMore: 'guideline_function'
                    })
                },
                {
                    type: "postback",
                    title: "Kết thúc cuộc nói chuyện",
                    payload: JSON.stringify({
                        type: "cancel"
                    })
                }
            ]
        },
        method: 'POST'
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error Sender Information: ', response.body.error);
        } else {
            return callback(body);
        }
        if (response) {
            console.log('response ok successfully');
        }
    });
}

//quick reply
/*
    [{
        content_type:"text",
        title:"Red",
        payload:"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
    },
    {
        content_type:"text",
        title:"Green",
        payload:"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
    }]
*/
function sendFBQuickReplyMessage(sender, elementArray, quickReplyArray) {
    console.log("do send structure message");
    request({
        timeout: 20000,
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: pageAccessToken},
        method: 'POST',
        json: {
            recipient:{
                id: sender
            },
            message:{
                // text:"Pick a color:",
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: elementArray
                    }
                },
                quick_replies: quickReplyArray
            }
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error quick reply Message: ', response.body.error);
        }
        if (response) {
            console.log('response ok successfully');
        }
    });
}




