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
  private aiPrompt: string = 'You are a friendly and helpful bot in a multiplayer game.'; // Initial AI prompt
  private fakeUsers: Set<string> = new Set();  // Set to store fake users' session IDs

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

    // Register a message handler for updating the AI prompt
    this.onMessage('update_prompt', (client, message) => {
      this.aiPrompt = message.prompt;
      console.log(`AI Prompt updated to: ${this.aiPrompt}`);
    });

    // Register a message handler for 'private_message'
    this.onMessage('private_message', (client, message) => {
      const fromPlayer  = client.sessionId;
      const toPlayer = message.sendPlayerId;
      const text = message.text;

      console.log(`Received private message from ${fromPlayer} to ${toPlayer}: ${text}`);
      
      // Send the private message to the intended recipient
      const recipient = this.clients.find(c => c.sessionId === toPlayer);
      if (recipient) {
        recipient.send('private_message', {
          user: fromPlayer,
          text: message.text,
        });
        console.log(`Sent private message from ${fromPlayer} to ${toPlayer}, ${recipient}: ${text}`);
      } else if (this.fakeUsers.has(toPlayer)) {
        console.log(`Fake user ${toPlayer} received a private message: ${text}`);
        // Send the message to ChatGPT API and get the response
        this.getChatGptResponse(text).then(chatGptResponse => {
          // Reply to fromPlayer with the ChatGPT response
          client.send('private_message', {
            user: toPlayer,
            text: chatGptResponse,
          });
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
                    { role: 'system', content: this.aiPrompt },
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
    this.fakeUsers.add(fakeSessionId);  // Add the fake user's session ID to the set

    console.log(`${fakePlayer.username} has been added to the room!`);
  }

  generateNumericSessionId() {
    // Generate an 8-digit numeric session ID
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, 'joined!');
  
    // Check if the client is the editor
    if (options.isEditor) {
      console.log('Editor client connected, not creating a new player.');
      return; // Skip creating a new player for the editor client
    }
  
    // Create a new player for regular clients
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
