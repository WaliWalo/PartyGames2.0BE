const express = require('express');
const cors = require('cors');
const listEndpoints = require('express-list-endpoints');
const mongoose = require('mongoose');
const roomRoutes = require('./routes/roomRoutes');
const messageRoutes = require('./routes/messageRoutes');
const questionRoutes = require('./routes/questionRoutes');
const userRoutes = require('./routes/userRoutes');

const http = require('http');
const createSocketServer = require('./socket');

const {
  notFoundHandler,
  notAuthorizedHandler,
  forbiddenHandler,
  badRequestHandler,
  genericErrorHandler,
} = require('./errorHandlers');

const server = express();
const httpServer = http.createServer(server);
createSocketServer(httpServer);

const whitelist = [`${process.env.FE_URL}`];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

server.use(cors(corsOptions));

server.use(express.json());

roomRoutes(server);
messageRoutes(server);
questionRoutes(server);
userRoutes(server);

// ERROR HANDLERS MIDDLEWARES

server.use(badRequestHandler);
server.use(notAuthorizedHandler);
server.use(forbiddenHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

console.log(listEndpoints(server));

module.exports = httpServer;
