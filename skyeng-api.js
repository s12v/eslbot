'use strict';

const https = require('https');


module.exports.requestToken = function (email) {
    return callWordsAPI(`/api/public/v1/users/token.json?email=${email}`, '{}');
};

module.exports.meanings = function (email, token) {
    return callWordsAPI(`/api/public/v1/users/meanings.json?email=${email}&token=${token}`, '{}')
        .then(data => {
            return data; // TODO
        })
};

function callWordsAPI(path, messageData) {
    return new Promise((resolve, reject) => {
        let body = JSON.stringify(messageData);
        let options = {
            host: "words.skyeng.ru",
            path: path,
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        };
        let onComplete = function (response) {
            let str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });
            response.on('end', () => {
                console.log(`SkyEng response ${str}`);
                resolve(str);
            });
        };
        let req = https.request(options, onComplete);
        req.on('error', e => {
            console.log(`Error response from SkyEng: ${e}`);
            reject(e);
        });

        console.log(`SkyEng request: ${body}`);
        req.write(body);
        req.end();
    })
}
