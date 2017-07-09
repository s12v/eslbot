'use strict';

const lexResponses = require('lex-responses');
const richMessages = require('rich-messages');
const db = require('db');

// TODO max number of attempts
// TODO first name

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
            {},
            'Fulfilled',
            {
                contentType: 'PlainText',
                content: richMessages.json([
                    richMessages.text('Good!', [
                        richMessages.option('Next test', 'Test'),
                        richMessages.option('Learn', 'Learn'),
                        richMessages.option('Stop', 'Stop'),
                    ])
                ])
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

function buildMessagesForTestCard(word) {
    let messages = [
        richMessages.text('Read the definition and guess a word'),
    ];

    if (word.image) {
        messages.push(richMessages.image(word.image))
    }

    messages.push(richMessages.text(word.definition));

    return messages;
}

function giveTask(word, intentRequest, callback) {
    callback(
        lexResponses.elicitSlot(
            {
                secretWord: word.word,
            },
            intentRequest.currentIntent.name,
            intentRequest.currentIntent.slots,
            'Word',
            {
                contentType: 'PlainText',
                content: richMessages.json(buildMessagesForTestCard(word))
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
            .getRandomTestWord(user)
            .then(word =>
                giveTask(word, intentRequest, callback)
            )
    }
}

function testIntentUnknownUser(callback) {
    callback(
        lexResponses.close(
            {},
            'Fulfilled',
            {
                contentType: 'PlainText',
                content: richMessages.json([
                    richMessages.text(`You haven't learned any words yet!`, [
                        richMessages.option('Learn', 'Learn'),
                        richMessages.option('Stop', 'Stop')
                    ])
                ])
            }
        )
    );
}
