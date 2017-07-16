'use strict';

const https = require('https');
const fs = require('fs');
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;

const config = {
    userName: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    options: {
        database: process.env.DB_DATABASE,
        encrypt: true
    }
};
const connection = new Connection(config);


let connectionPromise = new Promise(function(resolve, reject) {
    connection.on('connect', function(err) {
        if (err) {
            console.log(err);
            reject()
        } else{
            console.log('DB connection is successful');
            resolve();
        }
    });
});

const startId = 1;
connectionPromise
    .then(() => start(startId));


function start(id) {
    if (id <= 252831) {
        let percentage = Math.floor(100 * id / 252831);
        console.log(`word: ${id}, (${percentage}%)`);
        setTimeout(getWord, 50, id)
    } else {
        shutdown();
    }
}

function getWord(id) {
    https.get(`https://dictionary.skyeng.ru/api/public/v1/meanings?ids=${id}`, (res) => {
            if (res.statusCode !== 200) {
                throw `Invalid status code: ${res.statusCode}, id: ${id}`;
            }
            res.on(
                'data',
                d => {
                    let json = JSON.parse(d.toString())[0];
                    saveOnDisk(id, json);
                    if (json.difficultyLevel !== null) {
                        insertIntoDatabase(json)
                            .then(() => start(id + 1))
                    } else {
                        start(id + 1)
                    }
                }
            );
        }
    ).on('error', e => console.error(e));
}

function saveOnDisk(id, json) {
    let jstr = JSON.stringify(json);
    let subdir = Math.floor(id / 1000);
    if (!fs.existsSync(`words/${subdir}`)) {
        fs.mkdirSync(`words/${subdir}`);
    }
    fs.writeFileSync(`words/${subdir}/${id}.json`, jstr);
}

function insertIntoDatabase(json) {
    return new Promise(function(resolve, reject) {
        let word = json.text.replace(/'/g, "''");
        let jstr = JSON.stringify(json).replace(/'/g, "''");
        const sql = `insert into words
            select ${json.id}, ${json.difficultyLevel}, '${word}', '${jstr}'
            where not exists (select 1 from words where id = ${json.id})`;
        const request = new Request(
            sql,
            function(err, rowCount, rows) {
                if (err) {
                    console.log(err);
                    console.log(sql);
                    reject()
                } else{
                    console.log(rowCount + ' row(s) inserted');
                    resolve();
                }
            }
        );
        connection.execSql(request);
    })
}

function shutdown() {
    connection.close();
}
