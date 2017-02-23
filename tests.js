var crypto = require('crypto');

module.exports = {
    createEcbBlackBox: createEcbBlackBox,
    createBlackBox: createBlackBox,
};

function parseKeyValueString(keyValueString) {
    var obj = {};

    var keyValues = keyValueString.split('&');
    
    keyValues.forEach(function (keyValue) {
        var pair = keyValue.split('=');
        obj[pair[0]] = pair[1];
    });

    return obj;
}

function generateKeyValueString(obj) {
    var keyValueString = '';

    for (var property in obj) {
        if (obj.hasOwnProperty(property)) {
            keyValueString += property + '=';
            keyValueString += obj[property] + '&';
        }
    }

    keyValueString = keyValueString.slice(0, -1);
    return keyValueString;
}

function profileFor(email) {
    email = email.replace('&', '').replace('=', '');

    profile = {
        email: email,
        uid: 10,
        role: 'user',
    };

    return generateKeyValueString(profile);
}

function createEcbBlackBox() {
    // this black box contains a target string which is appended to user input

    var key;

    key = crypto.generateRandomBytes(16);

    return function (input) {
        var target = '' +
            'Um9sbGluJyBpbiBteSA1LjAKV2l0aCBteSByYWctdG9wIGRvd24gc28gbXkg' +
            'aGFpciBjYW4gYmxvdwpUaGUgZ2lybGllcyBvbiBzdGFuZGJ5IHdhdmluZyBq' +
            'dXN0IHRvIHNheSBoaQpEaWQgeW91IHN0b3A/IE5vLCBJIGp1c3QgZHJvdmUg' +
            'YnkK';
        target = crypto.base64Decode(target);

        input = crypto.concatenateBytes(input, target);

        return crypto.encryptAes128Ecb(input, key);
    };
}

function createBlackBox() {
    var key;
    var iv;
    var availableBlockModes = ['ecb', 'cbc'];
    var blockMode;
    var prefixLength;
    var prefix;
    var suffixLength;
    var suffix;

    key = crypto.generateRandomBytes(16);
    iv = crypto.generateRandomBytes(16);
    blockMode = availableBlockModes[randomInteger(0, 1)];
    prefixLength = crypto.randomInteger(5, 10);
    prefix = crypto.generateRandomBytes(prefixLength);
    suffixLength = crypto.randomInteger(5, 10);
    suffix = crypto.generateRandomBytes(suffixLength);

    return function (input) {
        input = crypto.concatenateBytes(prefix, input);
        input = crypto.concatenateBytes(input, suffix);
        if (blockMode === 'ecb') {
            return crypto.encryptAes128Ecb(input, key);
        } else if (blockMode === 'cbc') {
            return cryp.encryptAes128Cbc(input, key, iv);
        }
    };
}
