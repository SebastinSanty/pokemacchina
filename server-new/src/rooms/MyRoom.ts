import { JWT } from "@colyseus/auth";
import { Room, Client } from "@colyseus/core";
import { Schema, MapSchema, type } from "@colyseus/schema";
import dotenv from 'dotenv';
import axios, { AxiosError } from 'axios';  // Import Axios

import { createClient } from '@supabase/supabase-js'

dotenv.config();

const supabaseUrl = 'https://bfawgabxukpfgcecxbmx.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)


export class Vec2 extends Schema {
  @type("number") x: number;
  @type("number") y: number;
}

export class Player extends Schema {
  @type("string") username: string;
  @type("number") heroType: number; // sprite to use (1-12)
  @type(Vec2) position = new Vec2();
}

export class AIPlayer extends Player {
  @type("string") prompt: string;
  @type("number") id: number; // Add the id property to track the player's id
}

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type(["string"]) messages: string[] = [];
}

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;
  private fakeUsers: Set<string> = new Set();  // Set to store fake users' session IDs
  private promptsChannel; 

  onCreate(options: any) {
    console.log('Room created!');
    this.setState(new MyRoomState());

    // Fetch prompt data and create fake users
    this.loadPromptsAndCreateFakeUsers();

    // Register message handlers
    this.registerMessageHandlers();

    // Setup Supabase Realtime to listen for changes on the "prompts" table
    this.promptsChannel = supabase
        .channel('public:prompts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prompts' }, (payload) => {
            console.log('New prompt added:', payload);
            const newPlayer = payload.new;
            if (newPlayer) {
                this.addFakeUser(newPlayer);
            }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'prompts' }, (payload) => {
            console.log('Prompt updated:', payload);
            const updatedPlayer = payload.new;
            if (updatedPlayer) {
                this.reloadCharacter(updatedPlayer);
            }
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'prompts' }, (payload) => {
            console.log('Prompt deleted:', payload);
            const deletedPlayer = payload.old;
            if (deletedPlayer) {
                this.removeCharacter(deletedPlayer);
            }
        })
        .subscribe();
}



  static findRoomById(roomId: string, gameServer): MyRoom | undefined {
    return gameServer.getRoomById(roomId) as MyRoom | undefined;
  }

  static findRoomByType(roomType: string, gameServer): MyRoom | undefined {
    return gameServer.rooms.find((room) => room.roomName === roomType) as MyRoom | undefined;
}


  async loadPromptsAndCreateFakeUsers() {
    console.log('Loading prompts data...');
    try {
      const { data: prompts, error } = await supabase.from('prompts').select('*');

      if (error) {
        console.error('Error fetching prompts data:', error);
        return;
      }

      if (prompts) {
        prompts.forEach(prompt => {
          this.addFakeUser(prompt);
        });
      }
    } catch (err) {
      console.error('An error occurred while loading prompts data:', err);
    }
  }

  addFakeUser(playerDB) {
    const fakeSessionId = this.generateNumericSessionId();
    const fakePlayer = new AIPlayer();
    fakePlayer.username = playerDB.bot_name || `Bot ${fakeSessionId}`;
    fakePlayer.heroType = Math.floor(Math.random() * 12) + 1;
    fakePlayer.position.x = Math.floor(Math.random() * 100);
    fakePlayer.position.y = Math.floor(Math.random() * 100);

    fakePlayer.prompt = playerDB.bot_prompt || 'You are a friendly and helpful bot in a multiplayer game.';
    fakePlayer.id = playerDB.id;

    this.state.players.set(fakeSessionId, fakePlayer as Player);
    this.fakeUsers.add(fakeSessionId);

    console.log(`${fakePlayer.username} has been added to the room with prompt: ${fakePlayer.prompt}`);

  }

  reloadCharacter(playerDB) {

    // Find the player associated with the updated prompt
    const playerKey = Array.from(this.state.players.keys()).find(key => {
        const player = this.state.players.get(key);
        return player && player.username === playerDB.bot_name;
    });
    console.log(playerKey, playerDB)

    if (playerKey) {
        // Update the player's properties based on the new prompt data
        const player = this.state.players.get(playerKey);
        if (player) {
            const aiPlayer = player as AIPlayer;
            aiPlayer.username = playerDB.bot_name;
            aiPlayer.prompt = playerDB.bot_prompt;
            console.log(`Character ${player.username} updated due to prompt change:`, playerDB);
        }
        
    } else {
        console.log(`Character associated with ${playerDB.bot_name} not found. Adding as new.`);
        this.addFakeUser(playerDB);
    }
}

removeCharacter(playerDB) {
  // Find the player associated with the deleted prompt by id
  const playerKey = Array.from(this.state.players.keys()).find(key => {
    const player = this.state.players.get(key);
    return player && player instanceof AIPlayer && (player as AIPlayer).id === playerDB.id;
  });

  console.log(playerKey, playerDB);

  if (playerKey) {
    // Remove the player from the state
    this.state.players.delete(playerKey);
    this.fakeUsers.delete(playerKey);

    console.log(`Character with id ${playerDB.id} has been removed from the room.`);
    this.broadcast('player_list', Array.from(this.state.players.keys()));
  } else {
    console.log(`Character with id ${playerDB.id} not found. No action taken.`);
  }
}


  // Register message handlers
  registerMessageHandlers() {
    this.onMessage("move", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.position.x = message.x;
        player.position.y = message.y;
      }
    });

    this.onMessage('reload_prompts', async (client, message) => {
      console.log('Reloading prompts data...');
      await this.loadPromptsAndCreateFakeUsers();
    });

    this.onMessage('private_message', (client, message) => {
      const fromPlayer = client.sessionId;
      const toPlayer = message.sendPlayerId;
      const text = message.text;

      console.log(`Received private message from ${fromPlayer} to ${toPlayer}: ${text}`);
      
      const recipient = this.clients.find(c => c.sessionId === toPlayer);
      if (recipient) {
        recipient.send('private_message', {
          user: fromPlayer,
          text: message.text,
        });
        console.log(`Sent private message from ${fromPlayer} to ${toPlayer}, ${recipient}: ${text}`);
      } else if (this.fakeUsers.has(toPlayer)) {
        console.log(`Fake user ${toPlayer} received a private message: ${text}`);
        this.getChatGptResponse(text, toPlayer).then(chatGptResponse => {
          client.send('private_message', {
            user: toPlayer,
            text: chatGptResponse,
          });
        });
      }
    });
  }

  generateNumericSessionId() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  async getChatGptResponse(userMessage: string, toPlayer): Promise<string> {
    const maxRetries = 3;
    const baseDelay = 1000;

    const player = this.state.players.get(toPlayer);
    if (!player) {
        return "Sorry, I couldn't find that player.";
    }

    if (player instanceof AIPlayer) {  // Ensure it's an AIPlayer
      const aiPlayer = player as AIPlayer;


      for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
              const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                  model: 'gpt-3.5-turbo',
                  messages: [
                      { role: 'system', content: aiPlayer.prompt },
                      { role: 'user', content: userMessage }
                  ],
                  max_tokens: 50
              }, {
                  headers: {
                      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                      'Content-Type': 'application/json'
                  }
              });

              return response.data.choices[0].message.content.trim();
          } catch (error) {
              if (axios.isAxiosError(error)) {
                  if (error.response && error.response.status === 429) {
                      const delay = baseDelay * Math.pow(2, attempt);
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

    }

    return "Sorry, I'm having trouble responding right now. Please try again later.";
  }
  
  onJoin(client: Client, options: any) {
    console.log(client.sessionId, 'joined!');

    if (options.isEditor) {
      console.log('Editor client connected, not creating a new player.');
      return;
    }

    const player = new Player();
    player.username = client.auth?.username || `#User ${client.sessionId}`;
    player.heroType = Math.floor(Math.random() * 12) + 1;
    player.position.x = Math.floor(Math.random() * 100);
    player.position.y = Math.floor(Math.random() * 100);
    this.state.players.set(client.sessionId, player);

    this.broadcast('player_list', Array.from(this.state.players.keys()));
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, 'left!');
    this.state.players.delete(client.sessionId);

    this.broadcast('player_list', Array.from(this.state.players.keys()));
  }

  onDispose() {
    console.log('Room disposed!');
    if (this.promptsChannel) {
        this.promptsChannel.unsubscribe();  // Unsubscribe from the channel
    }
  }
}
