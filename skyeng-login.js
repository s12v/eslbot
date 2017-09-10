'use strict';

const lexResponses = require('lex-responses');
const richMessages = require('rich-messages');
const skyEngApi = require('skyeng-api');
const db = require('db');

exports.handle = function (intentRequest, callback) {
    db.findUser(intentRequest.userId)
        .then(user => {
                console.log(`User found: ${JSON.stringify(user)}`);
                if (user !== null) {
                    handleLoginIntent(intentRequest, callback);
                } else {
                    handleUnknownUser(callback);
                }
            }
        ).catch(e => {
            console.error(e);
            callback(
                lexResponses.close(
                    {},
                    'Fulfilled',
                    {
                        contentType: 'PlainText',
                        content: richMessages.json([
                            richMessages.text('Something went wrong', [
                                richMessages.option('Test', 'Test'),
                                richMessages.option('Learn', 'Learn'),
                            ])
                        ])
                    }
                )
            );
        }
    );
};

function handleLoginIntent(intentRequest, callback) {
    if ('Email' in intentRequest.currentIntent.slots && intentRequest.currentIntent.slots['Email'] !== null) {
        if ('Token' in intentRequest.currentIntent.slots && intentRequest.currentIntent.slots['Token'] !== null) {
            // TODO save to database
            callback(
                lexResponses.close(
                    {},
                    'Fulfilled',
                    {
                        contentType: 'PlainText',
                        content: richMessages.json([
                            richMessages.text('SkyEng information saved', [
                                richMessages.option('Learn', 'Learn'),
                                richMessages.option('Test', 'Test'),
                            ])
                        ])
                    }
                )
            );
        } else {
            skyEngApi.requestToken(intentRequest.currentIntent.slots.Email);
            callback(elicitToken(intentRequest));
        }
    } else {
        callback(elicitEmail(intentRequest));
    }
}

function elicitEmail(intentRequest) {
    return lexResponses.elicitSlot(
        {
        },
        intentRequest.currentIntent.name,
        {
            Email: null,
            Token: null
        },
        'Email',
        {
            contentType: 'PlainText',
            content: 'What is your email?'
        }
    )
}

function elicitToken(intentRequest) {
    return lexResponses.elicitSlot(
        {
        },
        intentRequest.currentIntent.name,
        {
            Email: intentRequest.currentIntent.slots['Email'],
            Token: null
        },
        'Token',
        {
            contentType: 'PlainText',
            content: richMessages.json([
                richMessages.text('I sent you an email with a token'),
                richMessages.text('Could you please enter it?')
            ])
        }
    )
}

function handleUnknownUser(callback) {
    callback(
        lexResponses.close(
            {},
            'Fulfilled',
            {
                contentType: 'PlainText',
                content: richMessages.json([
                    richMessages.text(`Please learn some words first!`, [
                        richMessages.option('Learn', 'Learn'),
                        richMessages.option('Stop', 'Stop')
                    ])
                ])
            }
        )
    );
}
