/**
 *Created by py on 13/02/2017
 */
'use strict';

module.export = (kafkaService, EventEmitter) => {
    let loggerCtrl = new EventEmitter();
    /**
     * listen Kafka 'logger' topic
     * on each kafkaMessage execute handleKafkaMessage
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