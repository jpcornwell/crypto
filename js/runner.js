var fs = require('fs');
var crypto = require('./crypto');
var crack = require('./crack');
var tests = require('./tests');

main();

function main() {

    var input = 'L77na/nrFsKvynd6HzOoG7GHTLXsTVu9qvY/2syLXzhPweyyMTJULu/6/kXX0KSvoOLSFQ==';
    input = crypto.base64Decode(input);
    var key = 'YELLOW SUBMARINE';
    key = crypto.asciiDecode(key);
    var nonce = 0;
    var output = crypto.applyCtrCipher(input, key, nonce);

    output = crypto.asciiEncode(output);
    console.log(output);
}
