/**
 * Created by DatHTSE61273 on 5/18/16.
 */
'use strict'
const mysql = require('mysql');
const request = require('request');
var express = require('express');
var router = express.Router();
var config = require('../common/app-config');
// handle process word from api.ai

var rowsData;

module.exports = {

    

    connectToDatabase: function (sql, callback) {

        var connection = mysql.createConnection({
            host     : config.database.connection.host,
            user     : config.database.connection.user,
            password : config.database.connection.password,
            database : config.database.connection.database
        });

        connection.connect();

        connection.query(sql, function(err, rows, fields) {
            if (err) throw err;
            console.log("DAng o db");
            return callback(rows);

        });

        connection.end();

    }

};

