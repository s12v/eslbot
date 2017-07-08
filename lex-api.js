'use strict';

const AWS = require('aws-sdk');
const lexruntime = new AWS.LexRuntime();

const BotName = process.env.BOT_NAME;
const BotAlias = process.env.BOT_ALIAS;

module.exports.send = function (userId, text) {
    return new Promise((resolve, reject) => {
        let params = {
            botName: BotName,
            botAlias: BotAlias,
            contentType: 'text/plain; charset=utf-8',
            inputStream: text,
            userId: userId,
            accept: 'text/plain; charset=utf-8'
        };

        console.log(`Lex params: ${JSON.stringify(params)}`);
        lexruntime.postContent(params, function (err, data) {
            if (err) reject(err);
            else     resolve(data);
        });
    });
};
