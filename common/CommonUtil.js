/**
 * Created by DatHT on 5/20/2016.
 */


'use strict'

module.exports = {

    isDefined: function (obj) {
        if (typeof obj == 'undefined') {
            return false;
        }

        if (!obj) {
            return false;
        }

        return obj != null;
    },

    //handle response to messenger
    splitResponse: function (str) {
        if (str.length <= 320) {
            return [str];
        }

        var result = this.chunkString(str, 300);

        return result;

    },

    chunkString: function (s, len) {
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
    createButton: function ( title, type, optionalString) {
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
};
