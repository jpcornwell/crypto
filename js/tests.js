var crypto = require('./crypto');

module.exports = {
    createProfileServerBlackBox: createProfileServerBlackBox,
    createEcbBlackBox: createEcbBlackBox,
    createBlackBox: createBlackBox,
    createCbcBlackBox: createCbcBlackBox,
    createCbcPaddingBlackBox: createCbcPaddingBlackBox,
};

function createCbcPaddingBlackBox() {
    var key = crypto.generateRandomBytes(16);
    var iv = crypto.generateRandomBytes(16);

    var encrypt = function () {
        var options = [
            'MDAwMDAwTm93IHRoYXQgdGhlIHBhcnR5IGlzIGp1bXBpbmc=',
            'MDAwMDAxV2l0aCB0aGUgYmFzcyBraWNrZWQgaW4gYW5kIHRoZSBWZWdhJ3MgYXJlIHB1bXBpbic=',
            'MDAwMDAyUXVpY2sgdG8gdGhlIHBvaW50LCB0byB0aGUgcG9pbnQsIG5vIGZha2luZw==',
            'MDAwMDAzQ29va2luZyBNQydzIGxpa2UgYSBwb3VuZCBvZiBiYWNvbg==',
            'MDAwMDA0QnVybmluZyAnZW0sIGlmIHlvdSBhaW4ndCBxdWljayBhbmQgbmltYmxl',
            'MDAwMDA1SSBnbyBjcmF6eSB3aGVuIEkgaGVhciBhIGN5bWJhbA==',
            'MDAwMDA2QW5kIGEgaGlnaCBoYXQgd2l0aCBhIHNvdXBlZCB1cCB0ZW1wbw==',
            'MDAwMDA3SSdtIG9uIGEgcm9sbCwgaXQncyB0aW1lIHRvIGdvIHNvbG8=',
            'MDAwMDA4b2xsaW4nIGluIG15IGZpdmUgcG9pbnQgb2g=',
            'MDAwMDA5aXRoIG15IHJhZy10b3AgZG93biBzbyBteSBoYWlyIGNhbiBibG93',
        ];
        var input = options[crypto.randomInteger(1, options.length) - 1];

        input = crypto.base64Decode(input);
        return {
            ciphertext: crypto.encryptAes128Cbc(input, key, iv),
            iv: iv,
        };
    };

    var decrypt = function (input) {
        try {
            var content = crypto.decryptAes128Cbc(input, key, iv);
        }
        catch (error) {
            if (error.message.includes('padding')) {
                return false;
            }
        }

        return true;
    };

    return {
        encrypt: encrypt,
        decrypt: decrypt,
    };
}

function createCbcBlackBox() {
    var key = crypto.generateRandomBytes(16);
    var iv = crypto.generateRandomBytes(16);

    var encrypt = function (input) {
        input = input.replace('=', '').replace(';', '');        

        var pre = 'comment1=cooking%20MCs;userdata=';
        var post = ';comment2=%20like%20a%20pound%20of%20bacon';
        input = pre + input + post;

        input = crypto.asciiDecode(input);
        return crypto.encryptAes128Cbc(input, key, iv);
    };

    var decrypt = function (input) {
        var profile = crypto.decryptAes128Cbc(input, key, iv);

        profile = crypto.asciiEncode(profile);
        return profile.includes('admin=true');
    };

    return {
        encrypt: encrypt,
        decrypt: decrypt,
    };
}

function createProfileServerBlackBox() {
    var key = crypto.generateRandomBytes(16);

    var provideEncryptedProfile = function (email) {
        var profile = profileFor(email);
        profile = crypto.asciiDecode(profile);

        return crypto.encryptAes128Ecb(profile, key);
    };

    var decryptProfile = function (cipherText) {
        var profileText = crypto.decryptAes128Ecb(cipherText, key);
        profileText = crypto.asciiEncode(profileText);

        var profile = parseKeyValueString(profileText);

        return profile;
    };

    return {
        provideEncryptedProfile: provideEncryptedProfile,
        decryptProfile: decryptProfile,
    };
}


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
