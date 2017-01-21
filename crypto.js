var fs = require('fs');
var crypto = require('crypto');

function addPkcsPadding(input, blockSize) {
    var bytesExtra = input.length % blockSize;

    if (bytesExtra === 0) {
        return input;
    }

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
        blocks[i] = encryptAes128Ecb(blocks[i], key);
    }

    return mergeBlocksIntoBytes(blocks, blockSize);
}

function decryptAes128Cbc(input, key, iv) {
    var blockSize = 16;
    var blocks = splitBytesIntoBlocks(input, blockSize);

    for (var i = blocks.length - 1; i >= 0; i--) {
        blocks[i] = decryptAes128Ecb(blocks[i], key);
        if (i === 0) {
            blocks[i] = fixedXor(blocks[i], iv);
        } else {
            blocks[i] = fixedXor(blocks[i], blocks[i - 1]);
        }
    }

    return mergeBlocksIntoBytes(blocks, blockSize);
}

function encryptAes128Ecb(input, key) {
    input = hexEncode(input);
    key = asciiEncode(key);
    var cipher = crypto.createCipheriv('aes-128-ecb', key, '');
    cipher.setAutoPadding(false);
    var crypted = cipher.update(input, 'hex', 'hex');
    crypted += cipher.final('hex');
    crypted = hexDecode(crypted);
    return crypted;
}

function decryptAes128Ecb(input, key) {
    input = hexEncode(input);
    key = asciiEncode(key);
    var decipher = crypto.createDecipheriv('aes-128-ecb', key, '');
    decipher.setAutoPadding(false);
    var dec = decipher.update(input, 'hex', 'hex');
    dec += decipher.final('hex');
    dec = hexDecode(dec);
    return dec;
}

function crackRepeatingKeyXor(input) {
    var keySize = guessKeySize(input);
    var key = guessKey(input, keySize);
    var text = asciiEncode(applyRepeatingKeyXor(input, key));
    return {text: text, key: key};

    function guessKeySize(input) {
        var low = 2;
        var hi = 40;

        var bestScore = 9999; // lower is better
        var bestSize = 0;
        for (var currentSize = low; currentSize <= hi; currentSize++) {
            var currentScore = scoreKeySize(input, currentSize);
            if (currentScore < bestScore) {
                bestScore = currentScore;
                bestSize = currentSize;
            }
        }

        return bestSize;
    }

    function scoreKeySize(input, keySize) {
        
        // split input into blocks of length keySize
        var blocks = [];
        var currentBlock = [];
        for (var i = 0, j = 0; i < input.length; i++) {
            currentBlock.push(input[i]);
            j++;
            if (j >= keySize) {
                blocks.push(currentBlock);
                currentBlock = [];
                j = 0;
            }
        }
       
        
        // compute list of normalized Hamming distances
        // compare block 1 with 2, 3 with 4, etc.
        var distances = [];
        for (var i = 0; i < blocks.length - 1; i += 2) {
            var hammingDistance = findHammingDistance(blocks[i], blocks[i+1]);
            var normalizedDistance = hammingDistance / keySize;
            distances.push(normalizedDistance);
        }

        // find the average of the distances
        var sum = 0;
        for (var i = 0; i < distances.length; i++) {
            sum += distances[i];
        }
        var averageDist = sum / distances.length;

        return averageDist;
    }

    function guessKey(input, keySize) {
        var blocks = [];
        for (var i = 0; i < keySize; i++) {
            blocks.push([]);
        }

        for (var i = 0; i < input.length; i++) {
            blocks[i%keySize].push(input[i]);
        }

        key = [];
        for (var i = 0; i < blocks.length; i++) {
            var keyByte = crackSingleByteXor(blocks[i])[0].key;
            key.push(keyByte);
        }

        return key;
    }
}

function crackSingleByteXor(input, num) {
    num = num || 1;

    var candidates = [];

    for (var i = 0; i <= 255; i++) {
        var currentCandidate = applyRepeatingKeyXor(input, [i]);
        currentCandidate = asciiEncode(currentCandidate);
        var currentScore = scoreEnglishText(currentCandidate);
        candidates.push({text: currentCandidate, score: currentScore, key: i});
    }

    candidates.sort(function (a, b) {
        if (a.score < b.score) return -1;
        if (a.score > b.score) return 1;
        return 0;
    });

    candidates.splice(num);

    return candidates;
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

function scoreEnglishText(text) {
    var englishFreq = {
        'a': 0.08167, 'b': 0.01492, 'c': 0.02782, 'd': 0.04253, 'e': 0.12702, 
        'f': 0.02228, 'g': 0.02015, 'h': 0.06094, 'i': 0.06966, 'j': 0.00153, 
        'k': 0.00772, 'l': 0.04025, 'm': 0.02406, 'n': 0.06749, 'o': 0.07507, 
        'p': 0.01929, 'q': 0.00095, 'r': 0.05987, 's': 0.06327, 't': 0.09056, 
        'u': 0.02758, 'v': 0.00978, 'w': 0.02360, 'x': 0.00150, 'y': 0.01974, 
        'z': 0.00074, ' ': 0.12702
    };

    text = text.toLowerCase();

    // initialize counts
    var counts = {};
    for (var i = 97; i <= 122; i++) {
        var char = String.fromCharCode(i);
        counts[char] = 0;
    }
    counts[' '] = 0;
    
    // count characters
    for (var i = 0; i < text.length; i++) {
        var char = text[i];
        var charCode = char.charCodeAt();
        // if char is a-z or space character
        if ((charCode >= 97 && charCode <= 122) || charCode === 32) {
            counts[char] += 1;
        } else if (counts[char] === undefined) {
            counts[char] = 1;
            englishFreq[char] = 0.001;
        } else {
            counts[char] += 1;
        }
    }

    // calculate score
    var score = 0;
    Object.keys(counts).forEach(function (char) {
        var expected = englishFreq[char] * text.length;
        score += (Math.pow(counts[char] - expected, 2) / expected);
    });

    return score;
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
