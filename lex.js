'use strict';

const lexResponses = require('lex-responses');
const db = require('db');
const BotName = 'DictBot';

const levels = ['Beginner', 'Intermediate', 'Advanced'];

function learnValidate(intentRequest, callback) {
    // TODO check user
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

function learn(intentRequest, callback) {
    if (intentRequest.invocationSource === 'DialogCodeHook') {
        learnValidate(intentRequest, callback);
    } else {
        db
            .getRandomWord(intentRequest.userId, intentRequest.currentIntent.slots['Level'])
            .then(row => wordData(row))
            .then(data => callback(
                lexResponses.close(
                    {
                        options: JSON.stringify([
                            {
                                text: 'Continue',
                                value: 'Continue'
                            },
                            {
                                text: 'Stop',
                                value: 'Stop'
                            }
                        ]),
                        word: data.word,
                        image: data.image,
                        audio: data.audio
                    },
                    'Fulfilled',
                    {
                        contentType: 'PlainText',
                        content: data.definition
                    }
                )
            ));
    }
}

function defineWord(intentRequest, callback) {
    const word = intentRequest.currentIntent.slots['Word'];
    db
        .getWord(word)
        .then(row => wordData(row))
        .then(data => {
                return callback(
                    lexResponses.close(
                        {
                            image: data.image,
                            audio: data.audio
                        },
                        'Fulfilled',
                        {
                            contentType: 'PlainText',
                            content: data.definition ? data.definition : "I don't know this word"
                        }
                    )
                )
            }
        );
}

function about(intentRequest, callback) {
    callback(
        lexResponses.close(
            {},
            'Fulfilled',
            {
                contentType: 'PlainText',
                content: `Hi hi!`
            }
        )
    );
}

function wordData(row) {
    if (row) {
        let data = JSON.parse(row.json);
        console.log(`DB data: ${row.json}`);
        return {
            word: row.word,
            definition: data.definition.text,
            image: data.images && data.images.length > 0 ? `http:${data.images[0].url}` : null,
            audio: data.soundUrl ? `http:${data.soundUrl}` : null
        };
    } else {
        return {}
    }
}

function dispatch(intentRequest, callback) {
    const name = intentRequest.currentIntent.name;
    if (name === 'DictAbout') {
        return about(intentRequest, callback);
    } else if (name === 'DefineWord') {
        return defineWord(intentRequest, callback);
    } else if (name === 'DictLearn') {
        return learn(intentRequest, callback);
    }
    throw new Error(`Intent with name ${name} not supported`);
}

function loggingCallback(response, originalCallback) {
    console.log(JSON.stringify(response, null, 2));
    originalCallback(null, response);
}

exports.handler = (event, context, callback) => {
    console.log(`event: ${JSON.stringify(event)}`);
    try {
        if (event.bot.name !== BotName) {
            callback(`Invalid bot name: ${event.bot.name}`);
        }
        dispatch(event, (response) => loggingCallback(response, callback));
    } catch (err) {
        callback(err);
    }
};
