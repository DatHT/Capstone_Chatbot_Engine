/**
 * Created by DatHT on 5/21/2016.
 */

'use strict'
const request = require('request');
var express = require('express');
var router = express.Router();
var structureObj = {
    title: "",
    image_url: "",
    subtitle: "",
    buttons:[
        {
            type: "web_url",
            url: "https://petersapparel.parseapp.com/view_item?item_id=100",
            title: "Xem chi tiết"
        },{
            type: "web_url",
            url: "https://petersapparel.parseapp.com/view_item?item_id=100",
            title: "Xem cái chi"
        }
        ]
};

module.exports = structureObj;