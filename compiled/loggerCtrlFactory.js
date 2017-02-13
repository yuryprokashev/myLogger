/**
 *Created by py on 13/02/2017
 */
'use strict';

module.export = function (kafkaService, EventEmitter) {
    var loggerCtrl = new EventEmitter();
    /**
     * listen Kafka 'logger' topic
     * on each kafkaMessage execute handleKafkaMessage
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
