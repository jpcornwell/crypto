

function hexDecode(hex) {
    var bytes = '';

    for (var i = 0; i < hex.length; i += 2) {
       bytes += String.fromCharCode((parseInt(hex.substr(i, 2), 16)));
    }
    
    return bytes;
}

function hexEncode(bytes) {

}

// need to replace btoa/atob with buffer.toString or use my own encoding logic
function base64Decode(base64) {
    return atob(base64);
}

function base64Encode(bytes) {
    return btoa(bytes);
}
