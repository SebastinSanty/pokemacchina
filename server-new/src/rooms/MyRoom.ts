import { JWT } from "@colyseus/auth";
import { Room, Client } from "@colyseus/core";
import { Schema, MapSchema, type } from "@colyseus/schema";
import dotenv from 'dotenv';
import axios, { AxiosError } from 'axios';  // Import Axios

dotenv.config();

export class Vec2 extends Schema {
  @type("number") x: number;
  @type("number") y: number;
}

export class Player extends Schema {
  @type("string") username: string;
  @type("number") heroType: number; // sprite to use (1-12)
  @type(Vec2) position = new Vec2();
}

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type(["string"]) messages: string[] = [];
}

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;

  static onAuth(token: string) {
    return JWT.verify(token);
  }

  onCreate(options: any) {
    console.log('Room created!');
    this.setState(new MyRoomState());

    // Add a fake user to the room with a username that follows the format of real users
    this.addFakeUser();

    // Register a message handler for 'move'
    this.onMessage("move", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.position.x = message.x;
        player.position.y = message.y;
      }
    });

    // Register a message handler for 'chat_message'
    this.onMessage('chat_message', async (client, message) => {
      console.log(`Received message from ${client.sessionId}: ${message.text}`);

      // Push only the message text to the state
      this.state.messages.push(message.text);  // Only push the text, not the entire object

      // Broadcast the full message object (with user and text)
      this.broadcast('chat_message', {
        user: client.sessionId,
        text: message.text,
      });

      // Send the message to ChatGPT API and get the response
      const chatGptResponse = await this.getChatGptResponse(message.text);

      // Broadcast the ChatGPT response as the fake user
      this.broadcast('chat_message', {
        user: 'Bot', // Username of the fake user
        text: chatGptResponse,
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

  async getChatGptResponse(userMessage: string): Promise<string> {
    const maxRetries = 3;  // Maximum number of retries
    const baseDelay = 1000; // Base delay in milliseconds

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',  // Adjust the model as necessary
                messages: [
                    { role: 'system', content: 'You are a friendly and helpful bot in a multiplayer game.' },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 50  // Adjust the response length as needed
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,  // Use the API key from environment variables
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content.trim();
        } catch (error) {
            if (axios.isAxiosError(error)) {  // Check if the error is an AxiosError
                if (error.response && error.response.status === 429) {
                    const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
                    console.warn(`Rate limited by OpenAI. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error('Error calling ChatGPT API:', error.message);
                    return "Sorry, I couldn't understand that. Could you please rephrase?";
                }
            } else {
                console.error('An unexpected error occurred:', error);
                return "Sorry, something went wrong. Please try again later.";
            }
        }
    }

    return "Sorry, I'm having trouble responding right now. Please try again later.";
}



  addFakeUser() {
    const fakeSessionId = this.generateNumericSessionId();
    const fakePlayer = new Player();
    // fakePlayer.username = `#User ${fakeSessionId}`;
    fakePlayer.username = `Bot`;
    fakePlayer.heroType = Math.floor(Math.random() * 12) + 1;
    fakePlayer.position.x = Math.floor(Math.random() * 100);
    fakePlayer.position.y = Math.floor(Math.random() * 100);

    this.state.players.set(fakeSessionId, fakePlayer);

    console.log(`${fakePlayer.username} has been added to the room!`);
  }

  generateNumericSessionId() {
    // Generate an 8-digit numeric session ID
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, 'joined!');
    
    const player = new Player();
    player.username = client.auth?.username || `#User ${client.sessionId}`;
    player.heroType = Math.floor(Math.random() * 12) + 1;
    player.position.x = Math.floor(Math.random() * 100);
    player.position.y = Math.floor(Math.random() * 100);
    this.state.players.set(client.sessionId, player);

    // Broadcast updated player list
    this.broadcast('player_list', Array.from(this.state.players.keys()));
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, 'left!');
    this.state.players.delete(client.sessionId);

    // Broadcast updated player list
    this.broadcast('player_list', Array.from(this.state.players.keys()));
  }

  onDispose() {
    console.log('Room disposed!');
  }
}
