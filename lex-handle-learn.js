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
    let massages = [richMessages.text(`Study this word: ${word.word}`)];
    if (word.audio) {
        massages.push(richMessages.audio(word.audio))
    }
    if (word.image) {
        massages.push(richMessages.image(word.image))
    }
    massages.push(richMessages.text(`Definition: ${word.definition}`, [
        richMessages.option('Next word', 'Continue'),
        richMessages.option('Start test', 'Test'),
        richMessages.option('Stop lesson', 'Stop')
    ]));

    return massages;
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
        });
}
