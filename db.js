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
    )).then(row => wordData(row));
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
            return execute(
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
    return connect()
        .then(() => selectFirst(
            'select * from words where id = 65977',
            {}
        )).then(row => wordData(row));
};


function wordData(row) {
    if (row) {
        let data = JSON.parse(row.json);
        console.log(`DB data: ${row.json}`);
        return {
            id: row.id,
            word: row.word,
            definition: data.definition.text,
            image: data.images && data.images.length > 0 ? `http:${data.images[0].url}` : null,
            audio: data.soundUrl ? `http:${data.soundUrl}` : null
        };
    } else {
        return {}
    }
}

module.exports.recordProgress = function (userId, wordId) {
    return connect()
        .then(() => {
            let sql =
                `begin tran
                    update progress set repeat_count = repeat_count + 1, updated_at = GETUTCDATE() where user_id = @userId and word_id = @wordId
                    if @@rowcount = 0
                    begin
                        insert into progress (user_id, word_id, repeat_count, next_repeat) values (@userId, @wordId, 1, DATEADD(week, 2, GETUTCDATE()))
                    end
                commit tran`;
            return execute(sql, {
                userId: userId,
                wordId: wordId
            });
        });
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
            console.log('Already connected');
            resolve();
        }
    })
}

function selectFirst(query, params) {
    return execute(query, params)
        .then(rows => rows[0] ? rows[0] : null)
}

function execute(query, params) {
    return new Promise((resolve, reject) => {
        console.log(`Running ${query}`);
        let request = new Request(
            query,
            function (err, rowCount, rows) {
                if (err) {
                    console.log(`DB error: ${err}`);
                    reject(err);
                } else {
                    console.log(`row count: ${rowCount}`);
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
