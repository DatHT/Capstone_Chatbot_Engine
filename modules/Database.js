/**
 * Created by DatHTSE61273 on 5/18/16.
 */
'use strict'
const mysql = require('mysql');
const request = require('request');
var express = require('express');
var router = express.Router();
// handle process word from api.ai

var rowsData;

module.exports = {

    

    connectToDatabase: function (sql, callback) {

        var connection = mysql.createConnection({
                "host" : "localhost",
                "user" : "root",
                "password" : "",
                "database" : "system_engine_bot_db"
            });

        connection.connect();

        connection.query(sql, function(err, rows, fields) {
            if (err) return new Error("Error: " + err);
            return callback(rows);

        });

        connection.end();

    }

};

