/**
 *Created by py on 09/02/2017
 * LOGGER AGENT
 *  Purpose
 *      Logger Agent purpose is to collect logs and send them to the central Logger Server.
 *      It also output to local console.
 *  How to use?
 *      Create your Components.
 *
 *      Important! Your components have to be instances of EventEmitter class. If they is not, you will see an error.
 *
 *      Create LoggerAgent by calling this factory function. Don't forger to pass kafkaService, and EventEmitter
 *      when you create LoggerAgent.
 *
 *      Call LoggerAgent.listenLoggerEventIn method. Pass array of Components you want to listen.
 *
 *      After that call Logger Agent will listen 'logger.agent.*' events in those Components and execute it's internal
 *      handlers.
 *
 *      Handlers will log the event data to console and send event data to kafka, so it reaches central LoggerServer.
 *
 *  What should I pass as args when I emit 'logger.agent.*' event?
 *      Call YourComponent.packLogMessage(callerFuncRef, logMessage) method.
 *          callerFunctionRef - reference to the function, where you call the 'packLogMessage' method (usually 'this').
 *          logMessage - String message you want to log.
 *
 *  How do I know, if the Service method call returned log message, or error message instead of result?
 *      You can check the result with YourComponent.isLogMessage(YourResult) call.
 *      It will return true, if YourResult has 'caller' property of type Function and it has 'message' property.
 *
 *  When to emit 'logger.agent.error events?
 *      Never emit 'logger.agent.error' events if error can propagate to upper level.
 *          When you call external method of the object from another object -> do not emit 'logger.agent.error'
 *
 *      Always emit 'logger.agent.error' events, if error can not propagate to upper level of your app.
 *          When you initialize the Object and there errors during initialization -> emit 'logger.agent.error'
 *
 *          When you have Controller with internal handlers, which call Services and you have error in the
 *          handler OR you have error coming from Service call in this handler -> emit 'logger.agent.error'
 *          Even, if you need to send the error to kafkaService, you anyway need to log it in Controller's
 *          handler. Otherwise, you won't get a clue of error origin in the LoggerServer log.
 *
 *      Using 'logger.agent.error' in Promise
 *          If your Service method returns Promise, you must
 *              in the Promise pass LogMessage object to reject. Use YourComponent.packLogMessage method for that.
 *              in catch() closure on in then(..., (error) => { emit 'logger.agent.event' with error as args}.
 *
 *  When to emit 'logger.agent.log' events?
 *      Anytime, you want to view event data on central LoggerServer -> emit 'logger.agent.log' event.
 *
 */

'use strict';

module.exports = (serviceNameToMonitor, kafkaService, EventEmitter) => {
    let loggerAgent;

    let handleError,
        handleLog,
        packEvent,
        logMessageSentCount,
        logMessagesLog;

    logMessageSentCount = {error: 0, log: 0};
    logMessagesLog = [];

    setInterval(()=>{
        console.log(`messages sent to Kafka ${JSON.stringify(logMessageSentCount)}`);
    }, 500);

    setTimeout(()=> {
        for(let item of logMessagesLog) {
            console.log(item);
        }
    }, 50);


    packEvent = (eventData) => {
        let message = {};

        message.occurredAt = new Date().valueOf();
        message.serviceName = serviceNameToMonitor;

        if(eventData instanceof Error) {
            message.type = 'error';
            message.emitter = 'see in stack trace';
            message.stack = eventData.stack.toString();
            logMessageSentCount.error++;
        }
        else {
            message.type = 'log';
            message.emitter = eventData.name;
            message.stack = eventData.stack;
            logMessageSentCount.log++;
            logMessagesLog.push(message);
        }
        return message;
    };

    loggerAgent = new EventEmitter();

    handleError = (error) => {
        // console.log(`\n---------------\nERROR\n${serviceNameToMonitor}\n${error.stack}\n---------------`);
        /**
         * Call kafkaService to enable aggregated error logs view at one point - loggerServer.
         * send to kafka:
         * - eventName - e.g. 'logger.agent.log'
         * - datetime, ms
         * - serviceName,
         * - callerName,
         * - message
         */
        let event = packEvent(error);

        kafkaService.send('logger-request', event);

    };

    handleLog = (emitter, message) => {
        // console.log(`\n---------------\nLOG\n${serviceNameToMonitor}\n${emitter}:\n${message}\n---------------`);
        /**
         * DO NOT SEND ANYTHING TO KAFKA, WHEN YOU HAVE LOGMESSAGE FROM KAFKASERVICE!
         * IT WILL CAUSE INFINITE LOOP.
         * If you call kafkaService.send() and onProducerSent emits 'log' message, system will end
         * up in infinite loop.
         * So all kafkaService 'log' events are not sent to Kafka. They are printed to console
         * of the service
         * ------------------------------
         * Call kafkaService to enable aggregated error logs view at one point - loggerServer.
         * send to kafka:
         * - eventName
         * - datetime, ms
         * - serviceName,
         * - callerName,
         * - message
         */
        if(emitter === 'kafkaService') {
            console.log(`\n---------------\nLOG\n${serviceNameToMonitor}\n${emitter}:\n${message}\n---------------`);
        }
        else {
            let event = packEvent({name: emitter, stack: message});

            kafkaService.send('logger-request', event);
        }
    };

    loggerAgent.listenLoggerEventsIn = componentArray => {
        /**
         * IMPORTANT!!! Each component in componentArray must be EventEmitter.
         * 1) add logger property to each component in componentArray, that will be Event Emitter.
         * 2) add 'logger.agent.error' event listener to component
         * 3) add 'logger.agent.log' event listener to component
         */
        for(let component of componentArray) {
            if(component instanceof EventEmitter) {
                component.on('logger.agent.error', handleError);
                component.on('logger.agent.log', handleLog);
            }
            else {
                let error = new Error(`component ${component} is not an instance of EventEmitter class`);
                loggerAgent.emit('logger.agent.error', error);
            }
        }
    };

    return loggerAgent;
};