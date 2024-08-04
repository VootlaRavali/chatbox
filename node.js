const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let users = {};
let chatHistory = [];

app.use(express.static('public'));

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'login':
                users[data.username] = ws;
                break;
            case 'join':
                ws.username = data.username;
                ws.room = data.room;
                broadcast({ username: 'System', text: `${data.username} has joined the room.` }, data.room);
                break;
            case 'exit':
                broadcast({ username: 'System', text: `${data.username} has left the room.` }, data.room);
                break;
            case 'message':
                chatHistory.push(data);
                broadcast(data, data.room);
                break;
            case 'history':
                ws.send(JSON.stringify({ type: 'history', messages: chatHistory.filter(msg => msg.room === data.room) }));
                break;
            case 'logout':
                delete users[data.username];
                break;
        }
    });
});

function broadcast(message, room) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.room === room) {
            client.send(JSON.stringify(message));
        }
    });
}

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
