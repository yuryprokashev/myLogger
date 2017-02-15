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

module.exports = function (serviceNameToMonitor, kafkaService, EventEmitter) {
    var loggerAgent = void 0;

    var handleError = void 0,
        handleLog = void 0,
        packEvent = void 0,
        logMessageSentCount = void 0;

    setInterval(function () {
        console.log('messages sent to Kafka ' + logMessageSentCount);
    }, 500);

    packEvent = function packEvent(eventData) {
        var message = {};

        message.occurredAt = new Date().valueOf();
        message.serviceName = serviceNameToMonitor;

        if (eventData instanceof Error) {
            message.type = 'error';
            message.emitter = 'see in stack trace';
            message.stack = eventData.stack.toString();
        } else {
            message.type = 'log';
            message.emitter = eventData.name;
            message.stack = eventData.stack;
        }
        logMessageSentCount++;
        return message;
    };

    loggerAgent = new EventEmitter();

    handleError = function handleError(error) {
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
        var event = packEvent(error);

        kafkaService.send('logger-request', event);
    };

    handleLog = function handleLog(emitter, message) {
        // console.log(`\n---------------\nLOG\n${serviceNameToMonitor}\n${emitter}:\n${message}\n---------------`);
        /**
         * Call kafkaService to enable aggregated error logs view at one point - loggerServer.
         * send to kafka:
         * - eventName
         * - datetime, ms
         * - serviceName,
         * - callerName,
         * - message
         */
        var event = packEvent({ name: emitter, stack: message });

        kafkaService.send('logger-request', event);
    };

    loggerAgent.listenLoggerEventsIn = function (componentArray) {
        /**
         * IMPORTANT!!! Each component in componentArray must be EventEmitter.
         * 1) add logger property to each component in componentArray, that will be Event Emitter.
         * 2) add 'logger.agent.error' event listener to component
         * 3) add 'logger.agent.log' event listener to component
         */
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = componentArray[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var component = _step.value;

                if (component instanceof EventEmitter) {
                    component.on('logger.agent.error', handleError);
                    component.on('logger.agent.log', handleLog);
                } else {
                    var error = new Error('component ' + component + ' is not an instance of EventEmitter class');
                    loggerAgent.emit('logger.agent.error', error);
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    };

    return loggerAgent;
};
