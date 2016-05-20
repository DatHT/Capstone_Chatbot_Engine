/**
 * Created by DatHT on 5/20/2016.
 */


'use strict'

const request = require('request');
var express = require('express');
var router = express.Router();
module.exports = {

    isDefined : function (obj) {
        if (typeof obj == 'undefined') {
            return false;
        }

        if (!obj) {
            return false;
        }

        return obj != null;
    }
};
