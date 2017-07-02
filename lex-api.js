'use strict';

const AWS = require('aws-sdk');
const lexruntime = new AWS.LexRuntime();

module.exports.send = function (userId, text) {
    return new Promise((resolve, reject) => {
        let params = {
            botAlias: 'Dev',
            botName: 'DictBot',
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
