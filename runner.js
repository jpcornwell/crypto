var fs = require('fs');
var crypto = require('./crypto');
var crack = require('./crack');
var tests = require('./tests');

main();

function main() {
    var server = tests.createCbcBlackBox();

    var profile = server.encrypt(String.fromCharCode(0).repeat(64));
    var corrupt = profile.slice(32, 48);
    var payload = crypto.asciiDecode('admin=true');
    for (var i = 0; i < corrupt.length; i++) {
        corrupt[i] = corrupt[i] ^ payload[i % payload.length];
    }
    profile.set(corrupt, 32);
    console.log(server.decrypt(profile));
}
