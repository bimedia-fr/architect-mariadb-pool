architect-mariadb-pool
=================

Expose a mariadb connection pool as architect plugin. Automaticaly returns connection to the pool after query.

### Installation

```sh
npm install --save architect-mariadb-pool
```

### Config Format
```js
module.exports = [{
    packagePath: "architect-mariadb-pool",
    pool:{
        host: 'localhost',
        user: 'user',
        port: 3306,
        password: process.env.PASSWORD,
        database: 'dbname'
    }
}];
```

### Usage

Boot [Architect](https://github.com/c9/architect) :

```js
var path = require('path');
var architect = require("architect");

var configPath = path.join(__dirname, "config.js");
var config = architect.loadConfig(configPath);

architect.createApp(config, function (err, app) {
    if (err) {
        throw err;
    }
    console.log("app ready");
});
```

Configure Architect with `config.js` :

```js
module.exports = [{
    packagePath: "architect-mariadb-pool",
    pool:{
        host: 'localhost',
        user: 'user',
        port: 3306,
        password: process.env.PASSWORD,
        database: 'dbname'
    }
}, './routes'];
```

Consume *db* plugin in your `./routes/package.json` :

```js
{
  "name": "routes",
  "version": "0.0.1",
  "main": "index.js",
  "private": true,

  "plugin": {
    "consumes": ["mariadb"]
  }
}
```
Eventually use mariadb connection in your routes `./routes/index.js` :

```js
module.exports = function setup(options, imports, register) {
    var rest = imports.rest;
    var db = imports.mariadb.pool;

    // register routes 
    rest.get('/hello/:name', async function (req, res, next) {
        const res = await db.query('SELECT * FROM Users WHERE id=$1', [req.params.name]);
        res.write("{'message':'hello," + res.rows[0].name + "'}");
        res.end();
    });
    
    register();
};
```
### Multiple pool configuration
This module supports multiple pools.

Here is how to define 2 different pools :
```js
module.exports = [{
    packagePath: "architect-mariadb-pool",
    first : {
    	host: 'host1',
        user: 'user',
        port: 3306,
        password: process.env.PASSWORD,
        database: 'dbname'
    },
	second : {
    	host: 'host2',
        user: 'user',
        port: 3306,
        password: process.env.PASSWORD,
        database: 'dbname2'
    },
    checkOnStartUp : true
}];
```

This will create 2 properties (`first` and `second`) in the `db` object.
```js
module.exports = function setup(options, imports, register) {
    var db = imports.mariadb;

    const res1 = await db.first.query('SELECT * FROM Users WHERE id=1');
    const res2 = await db.second.query('SELECT * FROM Roles WHERE id=1');

    register();
};
```
### Configuration

* `host` : serveur hostname or ip
* `port` : serveur port
* `user` : username to login,
* `password` : password to login,
* `database`: database name,



### API
The pool object (`mariadb`) has the following methods :

#### getConnection
Retreive a connection from the pool. see [mariadb getConnection](https://github.com/mariadb-corporation/mariadb-connector-nodejs/blob/master/documentation/promise-api.md#poolgetconnection--promise).


#### query
The `query` method let you directly query the database without worrying about the database connection. Behind the scene the method retreive a connection from the pool and close it afterward. The method signature is similar to [mariadb query](https://github.com/mariadb-corporation/mariadb-connector-nodejs/blob/master/documentation/promise-api.md#poolquerysql-values---promise).
* _string_ text: the query text;
* optional _array_ parameters: the query parameters;


```js
module.exports = function setup(options, imports, register) {
    var db = imports.mariadb.pool;
    
    db.query('SELECT * from USERS', function (err, res) {
        res.rows.forEach(console.log);
    });
    //...
};
```

#### queryStream

