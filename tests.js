var crypto = require('crypto');

module.exports = {
    createEcbBlackBox: createEcbBlackBox,
    createBlackBox: createBlackBox,
};

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
