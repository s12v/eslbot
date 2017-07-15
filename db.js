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
        connection.close();
        connection = null;
    }
};

module.exports.getWord = function (word) {
    return connect().then(() => selectFirst(
        'SELECT * FROM words WHERE word = @word',
        {
            word: word
        }
    )).then(row => wordData(row));
};

module.exports.findUser = function(userId) {
    return connect().then(() => selectFirst(
        'SELECT * FROM users WHERE id = @id',
        {
            id: userId
        }
    ));
};

module.exports.ensureUser = function(userId, level) {
    return connect().then(() => selectFirst(
        'SELECT * FROM users WHERE id = @id',
        {
            id: userId
        }
    )).then((user) => {
        if (user === null) {
            return execute(
                `INSERT INTO users (id, level) VALUES (@id, @level)`,
                {
                    id: userId,
                    level: level
                }
            )
        }
    });
};

module.exports.getRandomWord = function (user) {
    return connect()
        .then(() => selectFirst(
            `SELECT TOP 1 w.*
            FROM words w
              LEFT JOIN progress p
                ON w.id = p.word_id
                   AND p.user_id = @userId
            WHERE w.difficulty_level IN (${difficultyLevelByUserLevel(user.level).join(',')})
                  AND (p.next_repeat < GETUTCDATE() OR p.next_repeat IS NULL)
            ORDER BY newid()`,
            {
                userId: user.id
            }
        )).then(row => wordData(row));
};

module.exports.getRandomTestWord = function (user) {
    return connect()
        .then(() => selectFirst(
            `SELECT TOP 1 w.*
            FROM words w
              INNER JOIN progress p
                ON w.id = p.word_id
                   AND p.user_id = @userId
            ORDER BY p.next_repeat`,
            {
                userId: user.id
            }
        )).then(row => wordData(row));
};

module.exports.get10kWords = function () {
    return connect()
        .then(() => execute(
            'SELECT TOP 10000 word FROM words ORDER BY difficulty_level ASC',
            {}
        ));
};

module.exports.recordProgress = function (userId, wordId) {
    return connect()
        .then(() => {
            let sql =
                `BEGIN TRAN
                UPDATE progress
                SET repeat_count = repeat_count + 1, updated_at = GETUTCDATE(), next_repeat = DATEADD(WEEK, 2, GETUTCDATE())
                WHERE user_id = @userId AND word_id = @wordId
                IF @@rowcount = 0
                  BEGIN
                    INSERT INTO progress (user_id, word_id, repeat_count, next_repeat)
                    VALUES (@userId, @wordId, 1, DATEADD(WEEK, 2, GETUTCDATE()))
                  END
                COMMIT TRAN`;
            return execute(sql, {
                userId: userId,
                wordId: wordId
            });
        });
};

function connect() {
    return new Promise(function (resolve, reject) {
        if (connection === null) {
            connection = new Connection(config);
            connection.on('connect', function (err) {
                if (err) reject(err);
                else     resolve();
            });
        } else {
            resolve();
        }
    })
}

function difficultyLevelByUserLevel(level) {
    return [
        [1, 2, 3],
        [2, 3, 4, 5],
        [2, 3, 4, 5, 6]
    ][level];
}

function wordData(row) {
    if (row) {
        try {
            let data = JSON.parse(row.json);
            return {
                id: row.id,
                word: row.word,
                definition: data.definition.text,
                image: data.images && data.images.length > 0 ? `http:${data.images[0].url}` : null,
                audio: data.soundUrl ? `http:${data.soundUrl}` : null
            };
        } catch(e) {}
    }
    return null;
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
