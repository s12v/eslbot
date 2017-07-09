'use strict';

const AWS = require('aws-sdk');
const db = require('db');
const lexmodelbuildingservice = new AWS.LexModelBuildingService();

module.exports.slot = function () {
    db.getAllWords()
        .then(words => {
            let enumerationValues = words.map(word => {
                return {
                    value: word.word
                }
            });

            let params = {
                name: "ANY_WORD_ALL",
                description: "All available words",
                enumerationValues: enumerationValues
            };
            lexmodelbuildingservice.putSlotType(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                    close();
                } else {
                    console.log(data);
                    close();
                }
            });
        });
};

function close() {
    db.shutdown();
}
