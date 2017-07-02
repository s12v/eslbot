'use strict';

const https = require('https');

const PageAccessToken = process.env.PAGE_ACCESS_TOKEN;

module.exports.sendTyping = function (recipientId) {
    return callSendAPI({
        recipient: {
            id: recipientId
        },
        sender_action: 'typing_on'
    });
};

module.exports.sendText = function (recipientId, messageText, quickReplies) {
    return callSendAPI({
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            quick_replies: quickReplies
        }
    });
};

module.exports.sendImage = function (recipientId, imageUrl) {
    return callSendAPI({
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: 'image',
                payload: {
                    url: imageUrl,
                    "is_reusable":true
                }
            }
        }
    });
};

module.exports.sendAudio = function (recipientId, audioUrl) {
    return callSendAPI({
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: 'audio',
                payload: {
                    url: audioUrl,
                    "is_reusable":true
                }
            }
        }
    });
};

function callSendAPI(messageData) {
    return new Promise((resolve, reject) => {
        let body = JSON.stringify(messageData);
        let options = {
            host: "graph.facebook.com",
            path: `/v2.6/me/messages?access_token=${PageAccessToken}`,
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        };
        let onComplete = function (response) {
            let str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });
            response.on('end', () => {
                console.log(`FB response ${str}`);
                resolve(str);
            });
        };
        let req = https.request(options, onComplete);
        req.on('error', e => {
            console.log(`Error response from FB: ${e}`);
            reject(e);
        });

        console.log(`FB request: ${body}`);
        req.write(body);
        req.end();
    })
}
