
var englishFreq = {
    'a': 0.08167, 'b': 0.01492, 'c': 0.02782, 'd': 0.04253, 'e': 0.12702, 
    'f': 0.02228, 'g': 0.02015, 'h': 0.06094, 'i': 0.06966, 'j': 0.00153, 
    'k': 0.00772, 'l': 0.04025, 'm': 0.02406, 'n': 0.06749, 'o': 0.07507, 
    'p': 0.01929, 'q': 0.00095, 'r': 0.05987, 's': 0.06327, 't': 0.09056, 
    'u': 0.02758, 'v': 0.00978, 'w': 0.02360, 'x': 0.00150, 'y': 0.01974, 
    'z': 0.00074, ' ': 0.12702
};


function crackSingleByteXor(input, num) {
    var candidates = [];

    for (i = 0; i <= 255; i++) {
        var currentCandidate = applySingleByteXor(input, i);
        currentCandidate = asciiEncode(currentCandidate);
        var currentScore = scoreEnglishText(currentCandidate);
        candidates.push({text: currentCandidate, score: currentScore});
    }

    candidates.sort(function (a, b) {
        if (a.score < b.score) return -1;
        if (a.score > b.score) return 1;
        return 0;
    });

    candidates.splice(num + 1);

    return candidates;
}

function applySingleByteXor(input, byte) {
    var bytes = new Uint8Array(input.length); 

    for (var i = 0; i < bytes.length; i++) {
        bytes[i] = byte;
    }

    return fixedXor(input, bytes);
}


function scoreEnglishText(text) {
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
        }
    }

    // calculate score
    var score = 0;
    Object.keys(englishFreq).forEach(function (char) {
        var expected = englishFreq[char] * text.length;
        score += (Math.pow(counts[char] - expected, 2) / expected);
    });

    return score;
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
    var ascii = new Buffer(base64, 'base64').toString('ascii');
    var bytes = asciiDecode(ascii);

    return bytes;
}

function base64Encode(bytes) {
    var ascii = asciiEncode(bytes);
    var base64 = new Buffer(ascii).toString('base64');

    return base64;
}
