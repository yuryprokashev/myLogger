/**
 *Created by py on 13/02/2017
 */
'use strict';

module.exports = function (kafkaService, EventEmitter) {
    var loggerCtrl = new EventEmitter();
    /**
     * 1) listen Kafka 'logger-request' topic -> extract logRecord -> call loggerService.save(logRecordsArray)
     * 2) every 1 sec get the <serviceName>.kafka.log file from every kafka lib on
     *  on success -> extract logRecords from file -> call loggerService.save(logRecordsArray)
     *  on error -> create logRecord with Error message -> call loggerService.save(logRecordsArray)
     * 3) each 1 sec get logRecordsArrayUpdate -> printLogRecordToConsole(logRecord)
     */

    var handleKafkaMessage = function handleKafkaMessage(kafkaMessage) {
        var context = void 0;

        context = kafkaService.extractContext(kafkaMessage);

        console.log('\n---------------\n            \n' + context.serviceName.toUpperCase() + '\n            \n' + context.type.toUpperCase() + '\n            \n' + context.emitter + '\n            \n' + context.stack + '\n            \n---------------');
    };

    loggerCtrl.start = function () {
        kafkaService.subscribe('logger-request', handleKafkaMessage);
    };

    return loggerCtrl;
};
