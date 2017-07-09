'use strict';

const lexResponses = require('lex-responses');
const db = require('db');


exports.handle = function (intentRequest, callback) {
    db.findUser(intentRequest.userId)
        .then(user => {
                console.log(`User found: ${JSON.stringify(user)}`);
                if (user === null) {
                    testIntentUnknownUser(callback);
                } else {
                    handleTestIntent(user, intentRequest, callback);
                }
            }
        );
};

function correctAnswer(callback) {
    callback(
        lexResponses.close(
            {
                options: JSON.stringify([
                    {
                        text: 'Test again',
                        value: 'Test'
                    },
                    {
                        text: 'Learn',
                        value: 'Learn'
                    },
                    {
                        text: 'Stop',
                        value: 'Stop'
                    }
                ])
            },
            'Fulfilled',
            {
                contentType: 'PlainText',
                content: `Good!`
            }
        )
    );
}

function wrongAnswer(callback, intentRequest) {
    callback(
        lexResponses.elicitSlot(
            {
                secretWord: intentRequest.sessionAttributes.secretWord
            },
            intentRequest.currentIntent.name,
            intentRequest.currentIntent.slots,
            'Word',
            {
                contentType: 'PlainText',
                content: 'Nope. Try again!'
            }
        )
    )
}

function giveTask(word, intentRequest, callback) {
    callback(
        lexResponses.elicitSlot(
            {
                secretWord: word.word,
                image: word.image
            },
            intentRequest.currentIntent.name,
            intentRequest.currentIntent.slots,
            'Word',
            {
                contentType: 'PlainText',
                content: word.definition
            }
        )
    )
}

function handleTestIntent(user, intentRequest, callback) {
    console.log("handleTestIntent: " + JSON.stringify(intentRequest));
    if (intentRequest.currentIntent.slots['Word']) {
        if (intentRequest.sessionAttributes.secretWord === intentRequest.currentIntent.slots['Word']) {
            correctAnswer(callback);
        } else {
            wrongAnswer(callback, intentRequest);
        }
    } else {
        db
            .getRandomWord(user)
            .then(word =>
                giveTask(word, intentRequest, callback)
            )
    }
}

function testIntentUnknownUser(callback) {
    callback(
        lexResponses.close(
            {
                options: JSON.stringify([
                    {
                        text: 'Learn',
                        value: 'Learn'
                    },
                    {
                        text: 'Stop',
                        value: 'Stop'
                    }
                ])
            },
            'Fulfilled',
            {
                contentType: 'PlainText',
                content: `You haven't learned any words yet!`
            }
        )
    );
}
