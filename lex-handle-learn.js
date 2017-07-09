'use strict';

const lexResponses = require('lex-responses');
const db = require('db');

const levels = ['Beginner', 'Intermediate', 'Advanced'];


exports.handle = function (intentRequest, callback) {
    db.findUser(intentRequest.userId)
        .then(user => {
                console.log(`User found: ${JSON.stringify(user)}`);
                if (user === null) {
                    learnValidate(intentRequest, callback);
                } else {
                    learnFulfill(user, callback);
                }
            }
        );
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
                {
                    options: JSON.stringify(levels.map(level => {
                        return {
                            text: level,
                            value: level
                        };
                    }))
                },
                intentRequest.currentIntent.name,
                intentRequest.currentIntent.slots,
                'Level',
                {
                    contentType: 'PlainText',
                    content: 'What is your English level?'
                }
            )
        )
    }
}

function learnFulfill(user, callback) {
    db
        .getRandomWord(user)
        .then(word =>
            db
                .recordProgress(user.id, word.id)
                .then(() => word)
        )
        .then(word => callback(
            lexResponses.close(
                {
                    options: JSON.stringify([
                        {
                            text: 'Next word',
                            value: 'Continue'
                        },
                        {
                            text: 'Test',
                            value: 'Test'
                        },
                        {
                            text: 'Stop',
                            value: 'Stop'
                        }
                    ]),
                    word: word.word,
                    image: word.image,
                    audio: word.audio
                },
                'Fulfilled',
                {
                    contentType: 'PlainText',
                    content: word.definition
                }
            )
        ));
}
