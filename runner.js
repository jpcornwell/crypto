var fs = require('fs');
var crypto = require('./crypto');
var crack = require('./crack');
var tests = require('./tests');

main();

function main() {
    var server = tests.createProfileServerBlackBox();

    var cookie = server.provideEncryptedProfile('foo@bar.com');
    console.log(crypto.asciiEncode(cookie));

    console.log(server.decryptProfile(cookie));
}
