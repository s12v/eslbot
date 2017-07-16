'use strict';

const Types = {
    text: 'text',
    audio: 'audio',
    image: 'image',
};


module.exports.Types = Types;

module.exports.json = function (messages) {
    return JSON.stringify({
        messages: messages
    });
};

module.exports.parse = function (json) {
    try {
        let richMessages = JSON.parse(json);
        if (typeof richMessages === 'object' && richMessages !== null && richMessages.messages) {
            return richMessages.messages
        } else {
            return null;
        }
    } catch(e) {
        return null;
    }
};

module.exports.text = function (text, options) {
    return {
        type: Types.text,
        text: text,
        options: options
    };
};

module.exports.audio = function (url) {
    return {
        type: Types.audio,
        url: url
    };
};

module.exports.image = function (url) {
    return {
        type: Types.image,
        url: url
    };
};

module.exports.option = function (text, value) {
    return {
        text: text,
        value: value
    }
};
