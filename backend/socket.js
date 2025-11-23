const { Server } = require('socket.io');

let ioInstance = null;

function initIO(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
    },
  });
  return ioInstance;
}

function getIO() {
  return ioInstance;
}

module.exports = { initIO, getIO };