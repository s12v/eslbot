'use strict';

const lexResponses = require('lex-responses');
const db = require('db');


// TODO max number of attempts
// TODO voice input
// TODO first name
// TODO ./ffmpeg -i audioclip-1499559551000-1664.mp4 -ar 16000 -ac 1 output.wav

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
                        text: 'Next test',
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

    let message = intentRequest.inputTranscript
        ? `Your input: ${intentRequest.inputTranscript}. Wrong! Try again`
        : 'Nope. Try again!';

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
                content: message
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
        if (intentRequest.sessionAttributes.secretWord.toLowerCase() ===
            intentRequest.currentIntent.slots['Word'].toLowerCase()) {
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
