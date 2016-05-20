/**
 * Created by DatHTSE61273 on 5/18/16.
 */
'use strict'
const mysql = require('mysql');
const request = require('request');
var express = require('express');
var router = express.Router();
// handle process word from api.ai

module.exports = {
    connectToDatabase: function (param) {
        var connection = mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            password : '',
            database : 'chatbot'
        });

        connection.connect();

        connection.query('select * from food where name like %' + param + '%', function(err, rows, fields) {
            if (err) throw err;

            
            return rows;
        });

        connection.end();
    }

};

