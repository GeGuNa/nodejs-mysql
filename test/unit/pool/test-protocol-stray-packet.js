var assert = require('assert');
var common = require('../../common');

var connCount  = 0;
var connection = null;
var server     = common.createFakeServer();

server.listen(0, function (err) {
  assert.ifError(err);

  var pool = common.createPool({port: server.port()});

  pool.on('error', function (err) {
    assert.equal(err.code, 'PROTOCOL_STRAY_PACKET');
    assert.equal(err.fatal, true);
    connection.destroy();
    server.destroy();
  });

  pool.query('SELECT 1', function (err) {
    assert.ifError(err);

    pool.getConnection(function (err, conn) {
      assert.ifError(err);
      assert.equal(connCount, 2);

      connection = conn;

      pool.end(function (err) {
        assert.ifError(err);
        server.destroy();
      });
    });
  });
});

server.on('connection', function (conn) {
  connCount++;
  conn.handshake();
  conn.on('query', function(packet) {
    var resetPacketNumber = this._parser.resetPacketNumber;

    // Prevent packet number from being reset
    this._parser.resetPacketNumber = function () {};
    this._handleQueryPacket(packet);

    this._parser.resetPacketNumber = resetPacketNumber;
    this._sendPacket(new common.Packets.ResultSetHeaderPacket({
      fieldCount: 1
    }));
    this._parser.resetPacketNumber();
  });
});
