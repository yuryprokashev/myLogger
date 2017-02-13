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

var EventEmitter = require('events').EventEmitter;

var kafkaBusFactory = require('my-kafka').kafkaBusFactory;
var kafkaServiceFactory = require('my-kafka').kafkaServiceFactory;

var loggerCtrlFactory = require('./loggerCtrlFactory.es6');
var loggerAgentFactory = require('my-logger').loggerAgentFactory;

var kafkaBus = void 0;

var kafkaService = void 0;

var loggerCtrl = void 0,
    loggerAgent = void 0;

var startKafka = void 0,
    startLogic = void 0;

startKafka = function startKafka() {
    kafkaBus = kafkaBusFactory(kafkaHost, SERVICE_NAME, EventEmitter);
    kafkaService = kafkaServiceFactory(kafkaBus, EventEmitter);
    loggerAgent = loggerAgentFactory(SERVICE_NAME, kafkaService, EventEmitter);
    kafkaBus.producer.on('ready', startLogic);
};

startLogic = function startLogic() {
    loggerCtrl = loggerCtrlFactory(kafkaService, EventEmitter);
    loggerCtrlFactory.start();
};

startKafka();
