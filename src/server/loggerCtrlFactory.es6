/**
 *Created by py on 13/02/2017
 */
'use strict';

module.export = (kafkaService, EventEmitter) => {
    let loggerCtrl = new EventEmitter();
    /**
     * 1) listen Kafka 'logger-request' topic -> extract logRecord -> call loggerService.save(logRecordsArray)
     * 2) every 1 sec get the <serviceName>.kafka.log file from every kafka lib on
     *  on success -> extract logRecords from file -> call loggerService.save(logRecordsArray)
     *  on error -> create logRecord with Error message -> call loggerService.save(logRecordsArray)
     * 3) each 1 sec get logRecordsArrayUpdate -> printLogRecordToConsole(logRecord)
     */

    let handleKafkaMessage = (kafkaMessage) => {
        let context;

        context = kafkaService.extractContext(kafkaMessage);

        console.log(
            `\n---------------
            \n${context.serviceName.toUpperCase()}
            \n${context.type.toUpperCase()}
            \n${context.emitter}
            \n${context.stack}
            \n---------------`)
    };

    loggerCtrl.start = () => {
        kafkaService.subscribe('logger-request', handleKafkaMessage);
    };

    return loggerCtrl;
};