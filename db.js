'use strict';

const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const TYPES = require('tedious').TYPES;

const config = {
    userName: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    options: {
        database: process.env.DB_DATABASE,
        encrypt: true,
        useColumnNames: true,
        rowCollectionOnRequestCompletion: true,
    }
};

let connection = null;

module.exports.shutdown = function () {
    if (connection !== null) {
        console.log('close connection');
        connection.close();
        connection = null;
    }
};

module.exports.getWord = function (word) {
    return connect().then(() => selectFirst(
        'select * from words where word = @word',
        {
            word: word
        }
    ));
};

module.exports.findUser = function(userId) {
    return connect().then(() => selectFirst(
        'select * from users where id = @id',
        {
            id: userId
        }
    ));
};

module.exports.ensureUser = function(userId, level) {
    return connect().then(() => selectFirst(
        'select * from users where id = @id',
        {
            id: userId
        }
    )).then((user) => {
        console.log(`User found: ${JSON.stringify(user)}`);
        if (user === null) {
            return insert(
                `insert into users (id, level) values (@id, @level)`,
                {
                    id: userId,
                    level: level
                }
            )
        }
    });
};

module.exports.getRandomWord = function (userId, difficultyLevel) {
    return connect().then(() => selectFirst(
        'select * from words where id = 65977',
        {
        }
    ));
};

function connect() {
    return new Promise(function (resolve, reject) {
        if (connection === null) {
            console.log('Connecting...');
            connection = new Connection(config);
            connection.on('connect', function (err) {
                console.log('on connect');
                if (err) reject(err);
                else     resolve();
            });
        } else {
            resolve();
        }
    })
}

function selectFirst(query, params) {
    return select(query, params)
        .then(rows => rows[0] ? rows[0] : null)
}

function select(query, params) {
    return new Promise((resolve, reject) => {
        console.log('Reading rows from the Table...');
        let request = new Request(
            query,
            function (err, rowCount, rows) {
                if (err) {
                    reject(err);
                } else {
                    resolve(
                        rows.map(row => {
                            let r = {};
                            for (let key of Object.keys(row)) {
                                r[key] = row[key].value;
                            }
                            return r;
                        })
                    );
                }
            }
        );

        for (let key of Object.keys(params)) {
            const type = Number.isInteger(params[key]) ? TYPES.Int : TYPES.VarChar;
            request.addParameter(key, type, params[key]);
        }

        connection.execSql(request);
    });
}

function insert(sql, params) {
    return new Promise(function(resolve, reject) {
        const request = new Request(
            sql,
            function(err, rowCount) {
                if (err) {
                    console.log(err);
                    console.log(sql);
                    reject()
                } else {
                    console.log(rowCount + ' row(s) inserted');
                    resolve();
                }
            }
        );

        for (let key of Object.keys(params)) {
            const type = Number.isInteger(params[key]) ? TYPES.Int : TYPES.VarChar;
            request.addParameter(key, type, params[key]);
        }

        connection.execSql(request);
    })
}
