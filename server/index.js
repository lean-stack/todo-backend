
// Core modules
var fs        = require('fs');

// NPM packages
var express   = require('express');
var cors      = require('cors');

// Local modules
var httpApi   = require('./http-api');

// Express
var app = express();

// Enables CORS
app.use(cors());

// Socket.io
var server = require('http').Server(app);
var io = require('socket.io')(server);

io.on('connection', function(socket){
  var clientIp = socket.request.connection.remoteAddress;
  var clientPort = socket.request.connection.remotePort;
  console.log('New connection from ' + clientIp + ':' + clientPort);
});

// HTTP API backend
app.use('/api',httpApi(io));

server.listen(3000);
