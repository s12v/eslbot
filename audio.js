'use strict';

const child_process = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const TaskRoot = process.env.LAMBDA_TASK_ROOT;

exports.download = function (url, extension) {
    return new Promise((resolve, reject) => {
        let tmpFileName = randomFileName(extension);
        let outfile = fs.createWriteStream(tmpFileName);
        https.get(url, function (response) {
            response.pipe(outfile);
            outfile.on('finish', () => outfile.close(() => resolve(tmpFileName)));
        }).on('error', function (err) {
            fs.unlink(tmpFileName);
            reject(err);
        });
    });
};

exports.transcode = function (file) {
    return new Promise((resolve, reject) => {
        let tmpFileName = randomFileName('wav');
        let result = child_process.spawnSync(`${TaskRoot}/bin/ffmpeg`, [
            '-i', file, '-ar', '8000', '-ac', '1', tmpFileName
        ]);
        if (result.error || result.status !== 0) {
            console.error(result.error);
            console.error(result.status);
            console.error(result.stdout.toString());
            console.error(result.stderr.toString());
            reject(result.error ? result.error : 'Unable to download file');
        } else {
            console.log(result.status);
            console.log(result.stdout.toString());
            console.log(result.stderr.toString());
            console.log(`Transcoded to ${tmpFileName}`);
            resolve(tmpFileName);
        }
    });
};

function randomFileName(extension) {
    return '/tmp/' + crypto.randomBytes(16).toString('hex') + `.${extension}`;
}
