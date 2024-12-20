const mysql = require('mariadb');
const decorator = require('./PoolDecorator');

module.exports = function setup (options, imports, register) {
  const log = imports.log.getLogger('architect-mariadb-pool');

  const DEFAULT_CONFIG = {
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };

  function createPools (name, opts) {
    try {
      log.debug('create mariadb connection pool ', name);
      return decorator.decorate(mysql.createPool(Object.assign({}, DEFAULT_CONFIG, opts)));
    } catch (error) {
      log.error('unable to create pool ', name, error);
    }
  }

  const pools = Object.keys(options).reduce((prev, curr) => {
    const name = curr;
    const config = options[curr];
    if(config.host || config.port) {
      prev[curr] = createPools(curr, config);
    }
    return prev;
  }, {});

  try {
    register(null, {
      mariadb: pools,
      onDestroy: () => {
        return Promise.allSettled(Object.keys(pools).map(name => {
          log.debug('closing pool', name);
          return pools[name]._pool.end();
        }));
      }
    });
  } catch (e) {
    return register(e);
  }
}

module.exports.consumes = ['log'];
module.exports.provides = ['mariadb'];
