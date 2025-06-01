const adminer = require('adminer-node');

adminer({
  port: 5555,
  mysql: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Lzh+120710'
  }
}); 