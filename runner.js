var fs = require('fs');
var crypto = require('./crypto');
var crack = require('./crack');
var tests = require('./tests');

main();

function main() {
    var server = tests.createCbcPaddingBlackBox();

    var a = server.encrypt().ciphertext;
    console.log(server.decrypt(a));

    var b = server.encrypt().ciphertext;
    console.log(server.decrypt(b));
}
