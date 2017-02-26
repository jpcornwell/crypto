var crypto = require('crypto');

module.exports = {
    addPkcsPadding: addPkcsPadding,
    applyRepeatingKeyXor: applyRepeatingKeyXor,
    asciiDecode: asciiDecode,
    asciiEncode: asciiEncode,
    base64Decode: base64Decode,
    base64Encode: base64Encode,
    concatenateBytes: concatenateBytes,
    decryptAes128Cbc: decryptAes128Cbc,
    decryptAes128Ecb: decryptAes128Ecb,
    encryptAes128Cbc: encryptAes128Cbc,
    encryptAes128Ecb: encryptAes128Ecb,
    findHammingDistance: findHammingDistance,
    fixedXor: fixedXor,
    generateRandomBytes: generateRandomBytes,
    hexDecode: hexDecode,
    hexEncode: hexEncode,
    mergeBlocksIntoBytes: mergeBlocksIntoBytes,
    randomInteger: randomInteger,
    splitBytesIntoBlocks: splitBytesIntoBlocks,
    stripPkcsPadding: stripPkcsPadding,
}



function concatenateBytes(first, second) {
    var bytes = new Uint8Array(first.length + second.length);
    var bytesIndex = 0;

    for (var i = 0; i < first.length; i++) {
        bytes[bytesIndex] = first[i];
        bytesIndex++;
    }
    for (var i = 0; i < second.length; i++) {
        bytes[bytesIndex] = second[i];
        bytesIndex++;
    }
    return bytes;
}

function randomInteger(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

function generateRandomBytes(size) {
    var bytes = new Uint8Array(size);

    for (var i = 0; i < size; i++) {
        bytes[i] = randomInteger(0, 255);
    }

    return bytes;
}

function addPkcsPadding(input, blockSize) {
    var bytesExtra = input.length % blockSize;

    var bytesNeeded = blockSize - bytesExtra;
    var output = new Uint8Array(input.length + bytesNeeded);
    for (var i = 0; i < input.length; i++) {
        output[i] = input[i];
    }
    for (var i = 0; i < bytesNeeded; i++) {
        output[i + input.length] = bytesNeeded;
    }

    return output;
}

function stripPkcsPadding(input, blockSize) {
    var lastBlock = input.slice(-blockSize);
    var lastByteValue = lastBlock.slice(-1)[0];

    if (lastByteValue > blockSize) {
        throw 'Invalid padding';
    }

    var padding = lastBlock.slice(-lastByteValue);

    // make sure all bytes in padding have correct padding value
    for (var i = 0; i < padding.length; i++) {
        if (padding[i] !== lastByteValue) {
            throw 'Invalid padding';
        }
    }

    return input.slice(0, -padding.length);
}

function splitBytesIntoBlocks(input, blockSize) {
    if (input.length % blockSize !== 0) {
        throw new "Number of bytes of input is not a multiple of block size";
    }

    var outputBlocks = [];
    for (var i = 0; i < input.length; i += blockSize) {
        outputBlocks.push(new Uint8Array(input.slice(i, i + blockSize)));
    }
    return outputBlocks;
}

function mergeBlocksIntoBytes(input, blockSize) {
    if (input[input.length - 1].length !== blockSize) {
        throw new "Number of bytes of input is not a multiple of block size";
    }

    var output = new Uint8Array(input.length * blockSize);
    for (var i = 0; i < input.length; i++) {
        for (var j = 0; j < blockSize; j++) {
            output[i * blockSize + j] = input[i][j];
        }
    }

    return output;
}

function encryptAes128Cbc(input, key, iv) {
    var blockSize = 16;
    input = addPkcsPadding(input, blockSize);
    var blocks = splitBytesIntoBlocks(input, blockSize);
    for (var i = 0; i < blocks.length; i++) {
        if (i === 0) {
            blocks[i] = fixedXor(blocks[i], iv);
        } else {
            blocks[i] = fixedXor(blocks[i], blocks[i - 1]);
        }
        blocks[i] = encryptAes128Ecb(blocks[i], key, true);
    }

    return mergeBlocksIntoBytes(blocks, blockSize);
}

function decryptAes128Cbc(input, key, iv) {
    var blockSize = 16;
    var blocks = splitBytesIntoBlocks(input, blockSize);

    for (var i = blocks.length - 1; i >= 0; i--) {
        blocks[i] = decryptAes128Ecb(blocks[i], key, true);
        if (i === 0) {
            blocks[i] = fixedXor(blocks[i], iv);
        } else {
            blocks[i] = fixedXor(blocks[i], blocks[i - 1]);
        }
    }

    var output = mergeBlocksIntoBytes(blocks, blockSize);
    output = stripPkcsPadding(output, blockSize);
    return output;
}

function encryptAes128Ecb(input, key, disablePadding) {
    var blockSize = 16;
    if (disablePadding !== true) {
        input = addPkcsPadding(input, blockSize);
    }

    input = hexEncode(input);
    var cipher = crypto.createCipheriv('aes-128-ecb', key, '');
    cipher.setAutoPadding(false);
    var crypted = cipher.update(input, 'hex', 'hex');
    crypted += cipher.final('hex');
    crypted = hexDecode(crypted);
    return crypted;
}

function decryptAes128Ecb(input, key, disablePadding) {
    var blockSize = 16;
    input = hexEncode(input);
    var decipher = crypto.createDecipheriv('aes-128-ecb', key, '');
    decipher.setAutoPadding(false);
    var dec = decipher.update(input, 'hex', 'hex');
    dec += decipher.final('hex');
    dec = hexDecode(dec);

    if (disablePadding !== true) {
        dec = stripPkcsPadding(dec, blockSize);
    }

    return dec;
}

function applyRepeatingKeyXor(input, key) {
    var bytes = new Uint8Array(input.length); 

    for (var i = 0, j = 0; i < bytes.length; i++) {
        if (j >= key.length) j = 0;
        bytes[i] = key[j];
        j++;
    }

    return fixedXor(input, bytes);
}

function findHammingDistance(a, b) {
    xor = fixedXor(a, b);
    var count = 0;
    for (var i = 0; i < xor.length; i++) {
        count += xor[i].toString(2).split('1').length - 1;
    }
    return count;
}

function fixedXor(a, b) {
    if (a.length !== b.length) {
        throw 'inputs are not equal length';
    }

    var output = new Uint8Array(a.length);

    for (var i = 0; i < a.length; i++) {
        output[i] = a[i] ^ b[i];
    }

    return output;
}

function hexDecode(hex) {
    if (hex.length % 2 === 1) {
        throw 'hex string is not even length';
    }

    var bytes = new Uint8Array(hex.length / 2);

    for (var i = 0; i < hex.length; i += 2) {
       bytes[i/2] = parseInt(hex.substr(i, 2), 16);
    }
    
    return bytes;
}

function hexEncode(bytes) {
    var hex = '';

    for (var i = 0; i < bytes.length; i++) {
        var hexByte = bytes[i].toString(16);
        if (hexByte.length === 1) {
            hexByte = '0' + hexByte;
        }
        hex += hexByte;
    }

    return hex;
}

function asciiEncode(bytes) {
    var ascii = '';

    for (var i = 0; i < bytes.length; i++) {
        ascii += String.fromCharCode(bytes[i]);
    }

    return ascii;
}

function asciiDecode(ascii) {
    var bytes = new Uint8Array(ascii.length);

    for (var i = 0; i < ascii.length; i++) {
       bytes[i] = ascii.charAt(i).charCodeAt();
    }
    
    return bytes;
}

function base64Decode(base64) {
    var hex = new Buffer(base64, 'base64').toString('hex');
    var bytes = hexDecode(hex);

    return bytes;
}

function base64Encode(bytes) {
    var hex = hexEncode(bytes);
    var base64 = new Buffer(hex, 'hex').toString('base64');

    return base64;
}
