'use strict';

const lexResponses = require('lex-responses');
const richMessages = require('rich-messages');
const db = require('db');
const polly = require('polly-api');


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

function wrongAnswer(word, intentRequest, callback) {
    if (intentRequest.sessionAttributes.attempts >= 3) {
        skipTest(word, callback);
    } else {
        let attempts = parseInt(intentRequest.sessionAttributes.attempts) + 1;
        buildMessagesForTestCard(word, intentRequest, attempts, messages =>
            callback(
                lexResponses.elicitSlot(
                    {
                        json: intentRequest.sessionAttributes.json,
                        attempts: attempts
                    },
                    intentRequest.currentIntent.name,
                    intentRequest.currentIntent.slots,
                    'Word',
                    {
                        contentType: 'PlainText',
                        content: richMessages.json(messages)
                    }
                )
            )
        );
    }
}

function buildMessagesForTestCard(word, intentRequest, attempts, callback) {
    console.log(`buildMessagesForTestCard. word: ${word}, intentRequest: ${JSON.stringify(intentRequest)}, attempts: ${attempts}`);
    let messages = [];

    if (attempts === 0) {
        polly.getDefinitionAudio(word)
            .then((url) => {
                if (url) {
                    messages.push(richMessages.text('Listen to the definition and guess the word:'));
                    messages.push(richMessages.audio(url));
                } else {
                    messages.push(richMessages.text('Read the definition and guess the word:'));
                    messages.push(richMessages.text(word.definition));
                }

                callback(messages);
            });
    } else {
        if (intentRequest.inputTranscript) {
            messages.push(richMessages.text(`Your input: ${intentRequest.inputTranscript}`));
        }
        messages.push(richMessages.text('Incorrect. Try again!'));

        if (attempts === 1)  {
            messages.push(richMessages.text(`Here's a hint:`));
            if (word.image) {
                messages.push(richMessages.image(word.image));
            }
            messages.push(richMessages.text(word.definition, [
                richMessages.option(`I don't know`, `Skip`)
            ]));
        }

        if (attempts === 2 && word.audio)  {
            messages.push(richMessages.text(`Here's the final hint`));
            messages.push(richMessages.audio(word.audio, [
                richMessages.option(`I don't know`, `Skip`)
            ]));
        }

        callback(messages);
    }
}

function giveTask(word, intentRequest, callback) {
    buildMessagesForTestCard(word, intentRequest, 0, (messages) =>
        callback(
            lexResponses.elicitSlot(
                {
                    json: JSON.stringify(word),
                    attempts: 0
                },
                intentRequest.currentIntent.name,
                intentRequest.currentIntent.slots,
                'Word',
                {
                    contentType: 'PlainText',
                    content: richMessages.json(messages)
                }
            )
        )
    );
}

function skipTest(word, callback) {
    callback(
        lexResponses.close(
            {},
            'Fulfilled',
            {
                contentType: 'PlainText',
                content: richMessages.json([
                    richMessages.text(`Too bad! The answer is "${word.word}"`, [
                        richMessages.option('Next test', 'Test'),
                        richMessages.option('Learn', 'Learn'),
                        richMessages.option('Stop', 'Stop'),
                    ])
                ])
            }
        )
    );
}

function handleTestIntent(user, intentRequest, callback) {
    if (intentRequest.currentIntent.slots['Word']) {
        let lowercaseWord = intentRequest.currentIntent.slots['Word'].toLowerCase();
        let word = intentRequest.sessionAttributes.json ? JSON.parse(intentRequest.sessionAttributes.json) : {};
        if (lowercaseWord === 'skip' || lowercaseWord === `i don't know`) {
            skipTest(word, callback);
        } else {
            if (word && word.word.toLowerCase() === lowercaseWord) {
                db.recordProgress(user.id, word.id).then(() => correctAnswer(callback));
            } else {
                wrongAnswer(word, intentRequest, callback);
            }
        }
    } else {
        db
            .getRandomTestWord(user)
            .then(word => {
                    if (word) {
                        giveTask(word, intentRequest, callback)
                    } else {
                        callback(
                            lexResponses.close(
                                {},
                                'Fulfilled',
                                {
                                    contentType: 'PlainText',
                                    content: richMessages(`You haven't learned any words yet`, [
                                        richMessages.option('Learn', 'Learn'),
                                        richMessages.option('Stop', 'Stop'),
                                    ])
                                }
                            )
                        );
                    }
                }
            )
            .catch(e => {
                console.error(e, e.stack);
                callback(
                    lexResponses.close(
                        {},
                        'Fulfilled',
                        {
                            contentType: 'PlainText',
                            content: 'Something went wrong. Sorry. Try again.'
                        }
                    )
                );
            })
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
