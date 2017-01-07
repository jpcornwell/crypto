
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

// need to replace btoa/atob with buffer.toString or use my own encoding logic
function base64Decode(base64) {
    return atob(base64);
}

function base64Encode(bytes) {
    return btoa(bytes);
}
