const { Room } = require('colyseus');
const schema = require('@colyseus/schema');
const Schema = schema.Schema;
const type = schema.type;
const MapSchema = schema.MapSchema;

class Player extends Schema {
    constructor() {
        super();
        this.x = 0;
        this.y = 0;
    }
}
schema.defineTypes(Player, {
    x: "number",
    y: "number"
});

class State extends Schema {
    constructor() {
        super();
        this.players = new MapSchema();
        this.messages = [];
    }
}
schema.defineTypes(State, {
    players: { map: Player },
    messages: [ "string" ]
});

class MyRoom extends Room {
    onCreate(options) {
        console.log('Room created!');
        this.setState(new State());

        // Register a message handler for 'chat_message'
        this.onMessage('chat_message', (client, message) => {
            console.log(`Received message from ${client.sessionId}: ${message}`);
            
            // Add message to state and broadcast to all clients
            this.state.messages.push(message);
            this.broadcast('chat_message', message);
        });
    }

    onJoin(client, options) {
        this.state.players.set(client.sessionId, new Player());
        console.log(client.sessionId, 'joined!');
    }

    onLeave(client, consented) {
        this.state.players.delete(client.sessionId);
        console.log(client.sessionId, 'left!');
    }

    onDispose() {
        console.log('Room disposed!');
    }
}

module.exports = { MyRoom };
