/**
 *Created by py on 09/02/2017
 */

"use strict";

var SERVICE_NAME = 'loggerjs';

var KAFKA_TEST = "54.154.211.165";
var KAFKA_PROD = "54.154.226.55";
var parseProcessArgs = require('./parseProcessArgs.es6');
var args = parseProcessArgs();
var kafkaHost = function (bool) {
    var result = bool ? KAFKA_PROD : KAFKA_TEST;
    console.log(result);
    return result;
}(args[0].isProd);

var loggerCtrlFactory = require('./loggerCtrlFactory.es6');
