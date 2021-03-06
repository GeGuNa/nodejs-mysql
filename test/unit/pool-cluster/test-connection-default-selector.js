var assert  = require('assert');
var common  = require('../../common');

var cluster = common.createPoolCluster({defaultSelector: 'ORDER'});
var server  = common.createFakeServer();

server.listen(0, function (err) {
  assert.ifError(err);

  var poolConfig = common.getTestConfig({port: server.port()});
  cluster.add('SLAVE1', poolConfig);
  cluster.add('SLAVE2', poolConfig);

  var pool = cluster.of('SLAVE*');

  pool.getConnection(function (err, conn1) {
    assert.ifError(err);
    assert.strictEqual(conn1._clusterId, 'SLAVE1');

    pool.getConnection(function (err, conn2) {
      assert.ifError(err);
      assert.strictEqual(conn2._clusterId, 'SLAVE1');

      conn1.release();
      conn2.release();

      cluster.end(function (err) {
        assert.ifError(err);
        server.destroy();
      });
    });
  });
});
