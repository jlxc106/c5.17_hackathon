require('./config/config.js');
const express = require('express');
const path = require('path');
const http = require('http');
var fs = require('fs');

const publicPath2 = path.join(__dirname, '..');
const app = express();
var server = http.createServer(app);
const port = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(publicPath2));

  app.get('/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'index.html'));
  });
}


app.use((req, res, next) => {
  var now = new Date().toString();
  var log = `${now}: ${req.method} ${req.url}`;
  fs.appendFile('server.log', log + '\n', err => {
    if (err) {
      console.log('Unable to append to server.log');
    }
  });
  next();
});

require('./sockets/index.js')(server);

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
