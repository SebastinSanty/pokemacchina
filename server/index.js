const express = require('express');
const http = require('http');
const { Server } = require('colyseus');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const { MyRoom } = require('./MyRoom');

const port = process.env.PORT || 2567;
const app = express();

const server = http.createServer(app);

const gameServer = new Server({
    transport: new WebSocketTransport({
        server, // Pass the HTTP server instance to WebSocketTransport
    }),
});

gameServer.define('my_room', MyRoom);

app.use(express.static('public'));

server.listen(port, () => {
    console.log(`Listening on ws://localhost:${port}`);
});
