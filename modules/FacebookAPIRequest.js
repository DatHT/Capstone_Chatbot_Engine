/**
 * Created by ThanhTV0612 on 5/18/16.
 */
'use strict';
const request = require('request');
var util = require('util');

module.exports = {
    sendFBMessageTypeText: function(sender, pageAccessToken, messageData) {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: pageAccessToken},
            method: 'POST',
            json: {
                recipient: {id: sender},
                message: {text: messageData}
            }
        }, function (error, response, body) {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        });
    },

    doSubscribeRequest:  function (pageAccessToken) {
        request({
                method: 'POST',
                uri: "https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=" + pageAccessToken
            },
            function (error, response, body) {
                if (error) {
                    console.error('Error while subscription: ', error);
                } else {
                    console.log('Subscription result: ', response.body);
                }
            })
    },

    sendFBMessageTypeImage : function(sender, pageAccessToken, urlString) {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: pageAccessToken},
            method: 'POST',
            json: {
                recipient: {
                    id: sender
                },
                message: {
                    attachment : {
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
                console.log('Error: ', response.body.error);
            }
        })
    },

    sendFBMessageTypeImageFile : function(sender, pageAccessToken, urlImageFile) {
        var self = this;
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: pageAccessToken},
            method: 'POST',
            json: {
                recipient: {
                    id: sender
                },
                message: {
                    attachment : {
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
                console.log('Error: ', response.body.error);
            }
        })
    },

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
    sendFBMessageTypeButtonTemplate : function(sender, pageAccessToken, buttonArray) {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: pageAccessToken},
            method: 'POST',
            json: {
                recipient:{
                    id: sender
                },
                message:{
                    attachment:{
                        type: "template",
                        payload:{
                            template_type: "button",
                            text: "What do you want to do next?",
                            buttons: buttonArray
                        }
                    }
                }
            }
        }, function (error, response, body) {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        })
    },


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
    sendFBMessageTypeStructureMessage: function (sender, pageAccessToken, elementArray) {
        request({
            url: '',
            qs: {access_token: pageAccessToken},
            method: 'POST',
            json: {
                recipient: {
                    id: sender
                },
                message:{
                    attachment: {
                        type : "template",
                        payload : {
                            template_type: "generic",
                            elements: elementArray
                        }
                    }
                }
            }
        }), function (error, response, body) {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        }
    }
};


