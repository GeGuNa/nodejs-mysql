var common = require('../../common');
var assert = require('assert');
var Auth   = require(common.lib + '/protocol/Auth');
var Crypto = require('crypto');

var random = Crypto.pseudoRandomBytes || Crypto.randomBytes; // Depends on node.js version
var server = common.createFakeServer();

server.listen(0, function(err) {
  assert.ifError(err);

  var connection = common.createConnection({
    port     : server.port(),
    password : 'passwd'
  });

  connection.connect(function (err) {
    assert.ifError(err);
    connection.destroy();
    server.destroy();
  });
});

server.on('connection', function(incomingConnection) {
  random(20, function (err, scramble) {
    assert.ifError(err);

    incomingConnection.on('clientAuthentication', function (packet) {
      this._sendAuthResponse(packet.scrambleBuff, Auth.token('passwd', scramble));
    });

    incomingConnection.handshake({
      scrambleBuff1 : scramble.slice(0, 8),
      scrambleBuff2 : scramble.slice(8, 20)
    });
  });
});
