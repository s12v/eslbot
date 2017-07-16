'use strict';

const AWS = require('aws-sdk');
const fs = require('fs');
const audio = require('audio');

const lexruntime = new AWS.LexRuntime();

const BotName = process.env.BOT_NAME;
const BotAlias = process.env.BOT_ALIAS;

module.exports.sendText = function (userId, text) {
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

module.exports.sendAudio = function (userId, url) {
        return audio.download(url, 'mp4')
            .then(tmpFile => audio.transcode(tmpFile))
            .then(wavFile => sendAudioFile(userId, wavFile));
};

function sendAudioFile(userId, audioFile) {
    return new Promise((resolve, reject) => {
        let stream = fs.createReadStream(audioFile);
        let params = {
            botName: BotName,
            botAlias: BotAlias,
            contentType: 'audio/lpcm; sample-rate=8000; sample-size-bits=16; channel-count=1; is-big-endian=false',
            inputStream: stream,
            userId: userId,
            accept: 'text/plain; charset=utf-8'
        };

        console.log(`Lex params: ${JSON.stringify(params)}`);
        lexruntime.postContent(params, function (err, data) {
            if (err) reject(err);
            else     resolve(data);
        });
    });
}
