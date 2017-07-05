'use strict';

const facebookApi = require('facebook-api');
const lexApi = require('lex-api');

const VerifyToken = process.env.VERIFY_TOKEN;
const PageId = process.env.PAGE_ID;

module.exports.get = function (event, context, callback) {
    let query = event.queryStringParameters;
    if (query && query['hub.mode']) {
        if (query['hub.verify_token'] === VerifyToken) {
            callback(null, {
                statusCode: 200,
                body: query['hub.challenge']
            });
        } else {
            callback(null, {
                statusCode: 503,
                body: 'Error, wrong validation token'
            });
        }
    }
    callback(null, {
        statusCode: 403,
        body: 'Error, wrong validation token'
    });
};

module.exports.post = function (event, context, callback) {
    console.log(`POST: ${event.body}`);
    let data = JSON.parse(event.body);
    // Make sure this is a page subscription
    if (data.object === 'page') {
        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function (entry) {
            if (entry.id === PageId) {
                // Iterate over each messaging event
                entry.messaging.forEach(function (msg) {
                    if (msg.message && ! msg.message.is_echo) {
                        processMessage(msg);
                    } else {
                        console.log(`Webhook received unknown event: ${JSON.stringify(msg)}`);
                    }
                });
            } else {
                console.log(`Invalid page id: ${entry.id}`);
            }
        });
    }

    callback(null, {statusCode: 200, body: 'ok'});
};

function processMessage(message) {
    facebookApi.sendTyping(message.sender.id);
    if (message.attachments) {
        return facebookApi.sendText(message.sender.id, "Message with attachment received");
    } else if (message.message.text) {
        return lexApi
            .send(message.sender.id, message.message.text)
            .then(lexResult => {
                console.log(`Lex response: ${JSON.stringify(lexResult)}`);
                let session = lexResult.sessionAttributes ? lexResult.sessionAttributes : {};
                let p = Promise.resolve(1);
                if (session.word) {
                    p = p.then(() => facebookApi.sendText(message.sender.id, session.word));
                }
                if (session.audio) {
                    p = p.then(() => facebookApi.sendAudio(message.sender.id, lexResult.sessionAttributes.audio));
                }
                if (session.image) {
                    p = p.then(() => facebookApi.sendImage(message.sender.id, lexResult.sessionAttributes.image));
                }
                if (lexResult.message) {
                    let quickReplies = null;
                    if (session.options) {
                        quickReplies = JSON.parse(session.options).map(option => {
                            return {
                                content_type: 'text',
                                title: option.text,
                                payload: option.value
                            }
                        });
                    }
                    p = p.then(() => facebookApi.sendText(message.sender.id, lexResult.message, quickReplies));
                }

                return p;
            })
            .catch(err => console.log(err))
        ;
    }
}
