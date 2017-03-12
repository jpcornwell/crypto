var fs = require('fs');
var crypto = require('./crypto');
var crack = require('./crack');
var tests = require('./tests');

main();

function main() {
    var server = tests.createCbcPaddingBlackBox();

    var temp = server.encrypt();
    var a = temp.ciphertext;
    var iv = temp.iv;
    console.log(crypto.hexEncode(a));
    var a = crack.crackCbcPadding(server.decrypt, a, iv);
    console.log(a);
}
