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
            
            // Push only the message text to the state
            this.state.messages.push(message.text);  // Only push the text, not the entire object
            
            // Broadcast the full message object (with user and text)
            this.broadcast('chat_message', {
                user: client.sessionId,
                text: message.text,
            });
        });
        

        // Register a message handler for 'private_message'
        this.onMessage('private_message', (client, message) => {
            console.log(`Received private message from ${client.sessionId} to ${message.userId}: ${message.text}`);
            
            // Send the private message to the intended recipient
            const recipient = this.clients.find(c => c.sessionId === message.userId);
            if (recipient) {
                recipient.send('private_message', {
                    user: client.sessionId,
                    text: message.text,
                });
            }
        });
    }

    onJoin(client, options) {
        this.state.players.set(client.sessionId, new Player());
        console.log(client.sessionId, 'joined!');

        // Broadcast updated player list
        this.broadcast('player_list', Array.from(this.state.players.keys()));
    }

    onLeave(client, consented) {
        this.state.players.delete(client.sessionId);
        console.log(client.sessionId, 'left!');

        // Broadcast updated player list
        this.broadcast('player_list', Array.from(this.state.players.keys()));
    }

    onDispose() {
        console.log('Room disposed!');
    }
}

module.exports = { MyRoom };
