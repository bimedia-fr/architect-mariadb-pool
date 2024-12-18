const stream = require('stream');
const MariadbStreamWriter = require('./MariadbStreamWriter');
function deferred(fn) {
    var str = new stream.PassThrough({
        'objectMode': true
    });
    fn(str);
    return str;
}

function releaser(conn) {
    return function () {
        return conn.release();
    }
}
module.exports = {
    decorate(pool) {
        return {
            _pool: pool,
            connection: pool.getConnection.bind(pool),
            query: pool.query.bind(pool),
            StreamWriter: MariadbStreamWriter,
            queryStream: (sql, values) => {
                return deferred(function (str) {
                    pool.getConnection().then(conn => {
                        let release = releaser(conn);
                        let stream = conn.queryStream(sql, values);
                        stream.once('end', release);
                        stream.once('error', function (err) {
                            release(); // close conn on error
                            str.emit('error', err); // emit error.
                        });
                        stream.pipe(str);
                    });
                });
            }
        };
    }
};