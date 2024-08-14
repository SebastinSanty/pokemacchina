import './style.css'
import * as PIXI from "pixi.js";
import TweenJS, { Easing, Tween } from "@tweenjs/tween.js";

import { discordSDK } from './utils/DiscordSDK.js';
import { colyseusSDK } from './utils/Colyseus.js';
import type { MyRoomState, Player } from "../../server-new/src/rooms/MyRoom.js";
import { authenticate } from './utils/Auth.js';
import { PlayerObject } from './objects/PlayerObject.js';

import { Input, Button } from '@pixi/ui';
// import { lerp } from './utils/MathUtils.js';

const RESOLUTION = 4;

(async () => {
  /**
   * Create a PixiJS application.
   */
  const app = new PIXI.Application();


  // Intialize the application.
  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    background: '#763b36',
    resolution: RESOLUTION,
    roundPixels: true, // Pixel art
  });

  // Pixel art
  app.canvas.style.imageRendering = "pixelated";
  PIXI.TextureSource.defaultOptions.scaleMode = PIXI.DEPRECATED_SCALE_MODES.NEAREST;

  await PIXI.Assets.load([
    /**
     * Heros
     */
    { alias: "hero1", src: 'kenney_tiny-dungeon/Tiles/tile_0084.png' },
    { alias: "hero2", src: 'kenney_tiny-dungeon/Tiles/tile_0088.png' },
    { alias: "hero3", src: 'kenney_tiny-dungeon/Tiles/tile_0087.png' },
    { alias: "hero4", src: 'kenney_tiny-dungeon/Tiles/tile_0086.png' },
    { alias: "hero5", src: 'kenney_tiny-dungeon/Tiles/tile_0085.png' },
    { alias: "hero6", src: 'kenney_tiny-dungeon/Tiles/tile_0096.png' },
    { alias: "hero7", src: 'kenney_tiny-dungeon/Tiles/tile_0097.png' },
    { alias: "hero8", src: 'kenney_tiny-dungeon/Tiles/tile_0098.png' },
    { alias: "hero9", src: 'kenney_tiny-dungeon/Tiles/tile_0099.png' },
    { alias: "hero10", src: 'kenney_tiny-dungeon/Tiles/tile_0100.png' },
    { alias: "hero11", src: 'kenney_tiny-dungeon/Tiles/tile_0111.png' },
    { alias: "hero12", src: 'kenney_tiny-dungeon/Tiles/tile_0112.png' },

    /**
     * Potions
     */
    { alias: "potion1", src: 'kenney_tiny-dungeon/Tiles/tile_0128.png' },
    { alias: "potion2", src: 'kenney_tiny-dungeon/Tiles/tile_0127.png' },
    { alias: "potion3", src: 'kenney_tiny-dungeon/Tiles/tile_0126.png' },
    { alias: "potion4", src: 'kenney_tiny-dungeon/Tiles/tile_0125.png' },
    { alias: "potion5", src: 'kenney_tiny-dungeon/Tiles/tile_0113.png' },
    { alias: "potion6", src: 'kenney_tiny-dungeon/Tiles/tile_0114.png' },
    { alias: "potion7", src: 'kenney_tiny-dungeon/Tiles/tile_0115.png' },
    { alias: "potion7", src: 'kenney_tiny-dungeon/Tiles/tile_0116.png' },

    /**
     * Weapons
     */
    { alias: "shield1", src: 'kenney_tiny-dungeon/Tiles/tile_0101.png' },
    { alias: "shield2", src: 'kenney_tiny-dungeon/Tiles/tile_0102.png' },
    { alias: "sword1", src: 'kenney_tiny-dungeon/Tiles/tile_0103.png' },
    { alias: "sword2", src: 'kenney_tiny-dungeon/Tiles/tile_0104.png' },
    { alias: "sword3", src: 'kenney_tiny-dungeon/Tiles/tile_0105.png' },
    { alias: "sword4", src: 'kenney_tiny-dungeon/Tiles/tile_0106.png' },
    { alias: "sword5", src: 'kenney_tiny-dungeon/Tiles/tile_0107.png' },
    { alias: "axe1", src: 'kenney_tiny-dungeon/Tiles/tile_0117.png' },
    { alias: "axe2", src: 'kenney_tiny-dungeon/Tiles/tile_0118.png' },
    { alias: "axe3", src: 'kenney_tiny-dungeon/Tiles/tile_0119.png' },
    { alias: "staff1", src: 'kenney_tiny-dungeon/Tiles/tile_0129.png' },
    { alias: "staff2", src: 'kenney_tiny-dungeon/Tiles/tile_0130.png' },
    { alias: "staff3", src: 'kenney_tiny-dungeon/Tiles/tile_0131.png' },

    /**
     * Monsters
     */
    { alias: "monster1", src: 'kenney_tiny-dungeon/Tiles/tile_0108.png' },
    { alias: "monster2", src: 'kenney_tiny-dungeon/Tiles/tile_0109.png' },
    { alias: "monster3", src: 'kenney_tiny-dungeon/Tiles/tile_0110.png' },
    { alias: "monster4", src: 'kenney_tiny-dungeon/Tiles/tile_0111.png' },
    { alias: "monster5", src: 'kenney_tiny-dungeon/Tiles/tile_0122.png' },
    { alias: "monster6", src: 'kenney_tiny-dungeon/Tiles/tile_0121.png' },
    { alias: "monster7", src: 'kenney_tiny-dungeon/Tiles/tile_0120.png' },
    { alias: "monster8", src: 'kenney_tiny-dungeon/Tiles/tile_0123.png' },
    { alias: "monster9", src: 'kenney_tiny-dungeon/Tiles/tile_0124.png' },
  ]);

  // Then adding the application's canvas to the DOM body.
  document.body.appendChild(app.canvas);

  /**
   * Main game variables
   */
  let localPlayer: PIXI.Container; // we will use this to store the local player
  let playerSprites = new Map<Player, PIXI.Container>();
  let chatHistory: HTMLDivElement | null = null;
  const PADDING = 5; // Define a constant padding value globally


  const PROXIMITY_THRESHOLD = 50; // Set a distance threshold for proximity
  // let proximityBox: PIXI.Graphics;

  try {
    /**
     * Authenticate with Discord and get Colyseus JWT token
     */
    const authData = await authenticate();

    // Assign the token to authenticate with Colyseus (Room's onAuth)
    colyseusSDK.auth.token = authData.token;

  } catch (e) {
    console.error("Failed to authenticate", e);

    const error = new PIXI.Text({
      anchor: 0.5,
      text: "Failed to authenticate.",
      style: {
        fontSize: 18,
        fill: 0xff0000,
        stroke: 0x000000,
      }
    });
    error.position.x = app.screen.width / (RESOLUTION * 2);
    error.position.y = app.screen.height / (RESOLUTION * 2);

    app.stage.addChild(error);
    return;
  }

  /**
   * Join the game room
   */
  const room = await colyseusSDK.joinOrCreate<MyRoomState>("my_room", {
    channelId: discordSDK.channelId // join by channel ID
  });

  let chatMessages: Array<{ user: string; text: string }> = [];

// Function to send chat messages
function sendMessage(message: string) {
  console.log("Sent Message: ", message)
  if (room) {
    room.send('chat_message', { user: room.sessionId, text: message });
  }
}

// Listen for incoming chat messages
room.onMessage('chat_message', (messageData) => {
  console.log("On Message: ", messageData)
  chatMessages.push(messageData);
  updateChatHistory();
});

// Update the chat history display
function updateChatHistory() {
  // Ensure chatHistory is not null before proceeding
  if (proximityBox && chatHistory) {
    chatHistory.innerHTML = ""; // Clear existing content

    chatMessages.slice(-5).forEach((msg) => {
      const isSelf = msg.user === room.sessionId; // Check if the message was sent by the current user
      const messageElement = document.createElement("div");
      messageElement.className = `chat-message ${isSelf ? "self" : "other"}`;

      const bubbleElement = document.createElement("div");
      bubbleElement.className = `chat-bubble ${isSelf ? "self" : "other"}`;
      bubbleElement.innerText = msg.text;

      messageElement.appendChild(bubbleElement);
      chatHistory.appendChild(messageElement);
    });
  }
}





  // Create the proximity box and add it to the stage, but hide it initially
  function createProximityBox(): PIXI.Graphics {
    const boxWidth = 100;
    const boxHeight = 140;
    const padding = 5;
    const fontSize = 5;
  
    const box = new PIXI.Graphics()
      .roundRect(0, 0, boxWidth, boxHeight, 5)
      .fill(0x90a4ae);
  
    const text = new PIXI.Text("Chat with nearby user", {
      fontSize: fontSize,
      fill: 0x000000,
      wordWrap: true,
      wordWrapWidth: boxWidth - padding * 2
    });
    text.position.set(padding, padding);
    box.addChild(text);


    // const chatHistory = new PIXI.Text("", {
    //   fontSize: fontSize-1,
    //   fill: 0x000000,
    //   wordWrap: true,
    //   wordWrapWidth: boxWidth - padding * 2,
    // });
    // chatHistory.position.set(padding, padding*5);
    // box.addChild(chatHistory);


    const chatHistoryContainer = new PIXI.Container();
chatHistoryContainer.position.set(padding, padding * 5);
box.addChild(chatHistoryContainer);

chatHistory = document.createElement("div");
  chatHistory.style.position = "absolute";
  chatHistory.style.width = `590px`; // Set width to the full width of the box
  chatHistory.style.height = `1200px`; // Adjust height as needed (subtract space for text and input)
  chatHistory.style.paddingTop = "35px"; // Add padding to the chat history
  chatHistory.style.paddingLeft = "20px"; // Add padding to the chat history
  chatHistory.style.overflowY = "auto"; // Add scroll if necessary
  chatHistory.style.pointerEvents = "none"; // Ensure it doesn't interfere with PIXI.js interactivity
  chatHistory.style.background = "transparent"; // Ensure it has a transparent background

  document.body.appendChild(chatHistory);

  

    const placeholder = 'Enter Message'
    const align = 'left'
    const textColor = '#000000'
    const backgroundColor = '#F1D583'
    const borderColor = '#DCB000'
    const maxLength = 20
    const fontSizeI = 5
    const border = 1
    const height = 15
    const width = boxWidth - height*0.9 - height*0.9
    const radius = 4
    const amount = 1
    const paddingTop = 0
    const paddingRight = 0
    const paddingBottom = 0
    const paddingLeft = 5
    const cleanOnFocus = true
    const addMask = false

    const textip = new Input({
                    bg: new PIXI.Graphics()
                        .roundRect(0, 0, width, height, radius + border)
                        .fill(borderColor)
                        .roundRect(border, border, width - (border * 2), height - (border * 2), radius)
                        .fill(backgroundColor),
                    textStyle: {
                        fill: textColor,
                        fontSize: fontSizeI,
                    },
                    maxLength,
                    align,
                    placeholder,
                    value: '',
                    padding: [paddingTop, paddingRight, paddingBottom, paddingLeft],
                    cleanOnFocus,
                    addMask
                });


                
    
  
    box.visible = false;
    box.position.set(
      app.screen.width / (RESOLUTION * 2) - boxWidth / 2,
      app.screen.height / (RESOLUTION * 2) - boxHeight / 2
    );

    textip.position.set(padding, boxHeight - height - padding);
    


    const button = new Button(
      new PIXI.Graphics().roundRect(0, 0, height*0.9, height*0.9, height*0.9)
      .fill('#A5E24D')
    );

    button.view.position.set(boxWidth-padding-height*0.9, boxHeight - height*0.95 - padding);
    
    button.onPress.connect(() => {
      if (textip.value.trim() !== "") {
        sendMessage(textip.value.trim());
        textip.value = ''; // Clear input after sending
      }
    });

    
  
    box.addChild(textip);
    box.addChild(button.view);
  
    // Add a custom property to the box to store the text object
    (box as any).proximityText = text;

    (box as any).chatHistory = chatHistory;

    app.stage.addChild(box);
  
    return box;
  }



  // Initialize the proximity box
  let proximityBox = createProximityBox();




  /**
   * On player join
   */
  room.state.players.onAdd((player, sessionId) => {
    const sprite = new PlayerObject(player);
    playerSprites.set(player, sprite);

    if (sessionId === room.sessionId) {
      // Set local/current player
      localPlayer = sprite;

      // Set its initial position
      // (Do not listen for changes, as we are the ones changing the local player!)
      sprite.position.x = player.position.x;
      sprite.position.y = player.position.y;

    } else {
      // Listen for changes of other players
      player.position.onChange(() => {
        sprite.position.x = player.position.x;
        sprite.position.y = player.position.y;
      });
    }

    // Fade in effect
    sprite.scale.x = 0;
    sprite.scale.y = 0;
    sprite.alpha = 0;
    new Tween(sprite.scale)
      .to({ x: 1, y: 1 }, 250)
      .easing(Easing.Quadratic.Out)
      .start();
    new Tween(sprite)
      .to({ alpha: 1 }, 300)
      .start();
    // End fade effect

    app.stage.addChild(sprite);
  });

  /**
   * On player leave
   */
  room.state.players.onRemove((player, sessionId) => {
    const sprite = playerSprites.get(player)!;

    // Fade out & Remove sprite
    new Tween(sprite.scale)
      .to({ x: 0.1, y: 0.1 }, 100)
      .easing(Easing.Quadratic.Out)
      .onComplete(() => {
        app.stage.removeChild(sprite);
      })
      .start();
  });

  /**
   * Player input handling
   */
  const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  /**
   * Keyboard events
   */
  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      keys.up = true;
    } else if (event.key === "ArrowDown") {
      keys.down = true;
    } else if (event.key === "ArrowLeft") {
      keys.left = true;
    } else if (event.key === "ArrowRight") {
      keys.right = true;
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowUp") {
      keys.up = false;
    } else if (event.key === "ArrowDown") {
      keys.down = false;
    } else if (event.key === "ArrowLeft") {
      keys.left = false;
    } else if (event.key === "ArrowRight") {
      keys.right = false;
    }
  });

  /**
   * Main Game Loop
   */
  // Main Game Loop
  app.ticker.add((time) => {
    TweenJS.update(app.ticker.lastTime);
  
    if (localPlayer) {
      if (keys.up) {
        localPlayer.position.y -= 1;
      } else if (keys.down) {
        localPlayer.position.y += 1;
      }
  
      if (keys.left) {
        localPlayer.position.x -= 1;
      } else if (keys.right) {
        localPlayer.position.x += 1;
      }
  
      let closestPlayer: Player | null = null;
      let minDistance = PROXIMITY_THRESHOLD;
  
      playerSprites.forEach((sprite, player) => {
        if (sprite === localPlayer) return;
  
        const dx = localPlayer.position.x - sprite.position.x;
        const dy = localPlayer.position.y - sprite.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
  
        if (distance < minDistance) {
          minDistance = distance;
          closestPlayer = player;
        }
      });
  
      if (closestPlayer) {
        proximityBox.visible = true;
        (proximityBox as any).proximityText.text = `Chat with ${closestPlayer.username || 'another player'}`;
    
        const boxX = localPlayer.position.x + 50;
        const boxY = localPlayer.position.y - 50;
        proximityBox.position.set(boxX, boxY);
    
        // Convert PIXI.js coordinates to screen coordinates
        const rect = app.view.getBoundingClientRect();
        const globalX = rect.left + proximityBox.position.x * RESOLUTION;
        const globalY = rect.top + proximityBox.position.y * RESOLUTION;
    
        // Update the chatHistory position relative to the proximity box
        if (chatHistory) {
            chatHistory.style.left = `${globalX + PADDING}px`;
            chatHistory.style.top = `${globalY + 20}px`; // Adjust top position to align with the text and input
            chatHistory.style.display = 'block'; // Make sure the chat history is visible
        }
    } else {
        proximityBox.visible = false;
    
        // Hide the chatHistory when no player is close
        if (chatHistory) {
            chatHistory.style.display = 'none';
        }
    }
    
  
      room.send("move", {
        x: localPlayer.position.x,
        y: localPlayer.position.y
      });
    }
  });
  

})();