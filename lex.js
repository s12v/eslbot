'use strict';

const db = require('db');
const lexResponses = require('lex-responses');
const lexLearnHandler = require('lex-handle-learn');
const lexTestHandler = require('lex-handle-test');
const richMessages = require('rich-messages');

const BotName = process.env.BOT_NAME;


exports.handler = (event, context, callback) => {
    console.log(`event: ${JSON.stringify(event)}`);
    try {
        if (event.bot.name !== BotName) {
            callback(`Invalid bot name: ${event.bot.name}`);
        }
        dispatch(event, (response) => callbackWrapper(response, callback));
    } catch (err) {
        callback(err);
    }
};

function dispatch(intentRequest, callback) {
    const name = intentRequest.currentIntent.name;
    if (name === 'DictAbout') {
        return about(callback);
    } else if (name === 'DictStop') {
        return stop(callback);
    } else if (name === 'DefineWord') {
        return defineWord(intentRequest, callback);
    } else if (name === 'DictLearn') {
        return lexLearnHandler.handle(intentRequest, callback);
    } else if (name === 'DictTest') {
        return lexTestHandler.handle(intentRequest, callback);
    }
    throw new Error(`Intent with name ${name} not supported`);
}

function callbackWrapper(response, originalCallback) {
    console.log(JSON.stringify(response, null, 2));
    db.shutdown();
    originalCallback(null, response);
}

function defineWord(intentRequest, callback) {
    const word = intentRequest.currentIntent.slots['Word'];
    db
        .getWord(word)
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

function about(callback) {

    const messages = [];
    messages.push(richMessages.text(`Hi. I'm a bot. I can help you to learn new English words`));
    messages.push(richMessages.text(`You can send me text or voice messages`));
    messages.push(richMessages.text(`Say "start" to learn new words or "test" to test your skills`, [
        richMessages.option('Start', 'Start'),
        richMessages.option('Test', 'Test'),
    ]));

    callback(
        lexResponses.close(
            {},
            'Fulfilled',
            {
                contentType: 'PlainText',
                content: richMessages.json(messages)
            }
        )
    );
}

function stop(callback) {
    const replies = [
        'See you later!',
        'Thanks for your time. Good-bye',
        'Have a good day. Bye!'
    ];

    callback(
        lexResponses.close(
            {},
            'Fulfilled',
            {
                contentType: 'PlainText',
                content: replies[Math.floor(Math.random() * replies.length)]
            }
        )
    );
}
