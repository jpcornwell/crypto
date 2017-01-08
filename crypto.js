
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
