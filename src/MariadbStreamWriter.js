const stream = require('stream')

class MariadbStreamWriter extends stream.Writable {

    constructor(pool, sql) {
        super({ objectMode: true });
        this.pool = pool;
        this.sql = sql;
    }

    _write (chunk, encoding, done) {
        this.pool.batch(this.sql, [chunk]).then(() => {
            done();
        }).catch(done);
    }

    _writev(chunks, done) {
        this.pool.batch(this.sql, chunks.map(obj => obj.chunk)).then(() => {
            done();
        }).catch(done);
    }
}

module.exports = MariadbStreamWriter;
