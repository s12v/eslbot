'use strict';

const lexResponses = require('lex-responses');
const richMessages = require('rich-messages');
const db = require('db');

const levels = ['Beginner', 'Intermediate', 'Advanced'];


exports.handle = function (intentRequest, callback) {
    db.findUser(intentRequest.userId)
        .then(user => {
                console.log(`User found: ${JSON.stringify(user)}`);
                if (user === null) {
                    return learnValidate(intentRequest, callback);
                } else {
                    return learnFulfill(user, callback);
                }
            }
        )
        .catch(e => {
            console.error(e);
            callback(
                lexResponses.close(
                    {},
                    'Fulfilled',
                    {
                        contentType: 'PlainText',
                        content: 'Something went wrong. Please try again'
                    }
                )
            )
        });
};

function learnValidate(intentRequest, callback) {
    if (intentRequest.currentIntent.slots['Level'] && levels.includes(intentRequest.currentIntent.slots['Level'])) {
        db.ensureUser(intentRequest.userId, levels.indexOf(intentRequest.currentIntent.slots['Level']))
            .then(() => callback(
                lexResponses.delegate(
                    {},
                    intentRequest.currentIntent.slots
                )
            ));
    } else {
        callback(
            lexResponses.elicitSlot(
                {},
                intentRequest.currentIntent.name,
                intentRequest.currentIntent.slots,
                'Level',
                {
                    contentType: 'PlainText',
                    content: richMessages.json([
                       richMessages.text(
                           'What is your English level?',
                           levels.map(level => richMessages.option(level, level))
                       )
                    ])
                }
            )
        )
    }
}

function buildMessagesForLearnCard(word) {
    let messages = [];

    let w = word.prefix ? `${word.prefix} ${word.word}` : word.word;
    messages.push(richMessages.text(w));
    if (word.audio) {
        messages.push(richMessages.audio(word.audio))
    }
    if (word.image) {
        messages.push(richMessages.image(word.image))
    }

    messages.push(richMessages.text(`Definition: ${word.definition}`));

    for (let i = 0; i < word.examples.length; i++) {
        messages.push(richMessages.text(`Example ${i + 1}: ${word.examples[i]}`));
    }

    // Append options to the latest message
    messages[messages.length - 1].options = [
        richMessages.option('Next word', 'Continue'),
        richMessages.option('Start test', 'Test'),
        richMessages.option('Stop lesson', 'Stop')
    ];

    return messages;
}

function learnFulfill(user, callback) {
    db
        .getRandomWord(user)
        .then(word =>
            db
                .recordProgress(user.id, word.id)
                .then(() => word)
        )
        .then(word => {
            callback(
                lexResponses.close(
                    {},
                    'Fulfilled',
                    {
                        contentType: 'PlainText',
                        content: richMessages.json(buildMessagesForLearnCard(word))
                    }
                )
            )
        })
        .catch(e => {
            console.error(e);
            callback(
                lexResponses.close(
                    {},
                    'Fulfilled',
                    {
                        contentType: 'PlainText',
                        content: 'Error occurred. Please try again'
                    }
                )
            )
        });
}
