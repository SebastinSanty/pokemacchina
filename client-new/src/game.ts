import './style.css'
import * as PIXI from "pixi.js";
import TweenJS, { Easing, Tween } from "@tweenjs/tween.js";

import { colyseusSDK } from './utils/Colyseus.js';
import type { MyRoomState, Player } from "../../server-new/src/rooms/MyRoom.js";
import { PlayerObject } from './objects/PlayerObject.js';

import { Input, Button } from '@pixi/ui';
import { create } from 'domain';
// import { lerp } from './utils/MathUtils.js';

import 'bootstrap/dist/css/bootstrap.min.css';

const RESOLUTION = 4;

export async function initGame() {
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
  // let chatBox: PIXI.Graphics;

  /**
   * Join the game room
   */
  const room = await colyseusSDK.joinOrCreate<MyRoomState>("my_room", {
  });


// Function to send chat messages
function sendMessage(message: string) {
  console.log("Sent Message: ", message)
  if (room) {
    room.send('chat_message', { user: room.sessionId, text: message });
  }
}

function getPlayerIdByUsername(username) {
  for (let [playerId, player] of room.state.players) {
      if (player.username === username) {
          return playerId;
      }
  }
  return null; // Return null if the username is not found
}





const activeChatBoxes = new Map<string, ReturnType<typeof createProximityBoxInstance>>(); // Store chat boxes by player username


// Listen for incoming chat messages
room.onMessage('chat_message', (messageData) => {
  console.log("On Message: ", messageData)
  chatMessages.push(messageData);
  updateChatHistory();
});

function handleOutgoingPrivateMessage(sendingPlayer, messageData) {
  const { user: toPlayerId, text } = messageData;

  const player = room.state.players.get(toPlayerId);
  const playerUsername = player ? player.username : 'Unknown Player';

  console.log(room.state.players, player, toPlayerId)

  let chatBoxInstance = activeChatBoxes.get(player);
  let chatMessages: Array<{ user: string; text: string }> = [];

  chatMessages.push({ user: sendingPlayer, text });
  chatBoxInstance.updateChatHistory(chatMessages);
}

function sendMessageToPlayer(playerUsername: string, message: string) {
  const playerId = getPlayerIdByUsername(playerUsername);
  console.log("Player ID: ", playerId)
  console.log("Sent Message: ", message, " to ", playerId)
  if (room) {
    room.send('private_message', { sendPlayerId: playerId, text: message });
    handleOutgoingPrivateMessage(room.sessionId, { user: playerId, text: message });
  }
}

// Function to handle incoming private messages
function handleIncomingPrivateMessage(messageData) {
  const { user: fromPlayerId, text } = messageData;

  // Find the player object by sessionId to get the username (if needed)
  const player = room.state.players.get(fromPlayerId);
  const playerUsername = player ? player.username : 'Unknown Player';

  // Check if a chat box already exists for this player
  let chatBoxInstance = activeChatBoxes.get(player);
  let chatMessages: Array<{ user: string; text: string }> = [];
  
  // Update the chat history with the new message
  chatMessages.push({ user: fromPlayerId, text });
  chatBoxInstance.updateChatHistory(chatMessages);
}

// Listen for incoming private messages
room.onMessage('private_message', handleIncomingPrivateMessage);

function createProximityBoxInstance(playerUsername: string) {
  const boxWidth = 320;
  const boxHeight = 420;
  const padding = 5;
  const fontSize = 12;

  // Create the main container for the proximity box
  const chatBox = document.createElement("div");
  chatBox.className = "proximity-box card shadow mb-5 bg-light rounded";
  chatBox.style.position = "absolute";
  chatBox.style.width = `${boxWidth}px`;
  chatBox.style.height = `${boxHeight}px`;
  chatBox.style.visibility = "hidden"; // Initially hidden

  // Make chatBoxBody a flex container
  const chatBoxBody = document.createElement("div");
  chatBoxBody.className = "card-body";
  chatBoxBody.style.display = "flex";
  chatBoxBody.style.flexDirection = "column";
  chatBoxBody.style.height = "100%";
  chatBox.appendChild(chatBoxBody);

  const chatHeader = document.createElement("h6");
  chatHeader.className = "proximity-text card-title";
  chatHeader.innerText = `Chat with ${playerUsername || 'another player'}`;
  chatBoxBody.appendChild(chatHeader);

  // Allow chatHistory to grow and shrink
  const chatHistory = document.createElement("div");
  chatHistory.style.flexGrow = "1";
  chatHistory.style.overflowY = "auto";
  chatHistory.className = "card-text";
  chatBoxBody.appendChild(chatHistory);

  const chatInputGroup = document.createElement("div");
  chatInputGroup.className = "input-group input-group-sm mt-2";
  chatBoxBody.appendChild(chatInputGroup);

  const chatInput = document.createElement("input");
  chatInput.type = "text";
  chatInput.className = "form-control";
  chatInput.placeholder = "Enter message";
  chatInput.style.fontSize = `18px`;
  chatInputGroup.appendChild(chatInput);

  const sendButton = document.createElement("button");
  sendButton.className = "btn btn-dark";
  sendButton.innerHTML = '➤';
  chatInputGroup.appendChild(sendButton);

  document.body.appendChild(chatBox);

  // Functionality for sending a message
  sendButton.addEventListener("click", () => {
      if (chatInput.value.trim() !== "") {
          sendMessageToPlayer(playerUsername, chatInput.value.trim());
          chatInput.value = ''; // Clear input after sending
      }
  });

  chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && chatInput.value.trim() !== "") {
          sendButton.click(); // Trigger the send button click event
      }
  });

  function updateChatHistory(messages) {
      // chatHistory.innerHTML = ""; // Clear existing content
      messages.slice(-5).forEach((msg) => {
          // console.log("Message: ", msg)
          // console.log("Room Session ID: ", room.sessionId)
          const isSelf = msg.user === room.sessionId;
          const messageElement = document.createElement("div");

          // Style the message bubble
          messageElement.style.padding = "8px 12px";
          messageElement.style.margin = "4px 0";
          messageElement.style.borderRadius = "15px";
          messageElement.style.maxWidth = "70%";
          // messageElement.style.fontSize = `12px`;
          messageElement.style.wordWrap = "break-word"; // Ensure text wraps within the bubble
          messageElement.style.width = "fit-content"; // Adjust the width based on content

          if (isSelf) {
              // Sent message styling (blue, right)
              messageElement.style.backgroundColor = "#763b36"; // Blue background
              messageElement.style.color = "white";
              messageElement.style.alignSelf = "flex-end"; // Align to the right
              messageElement.style.marginLeft = "auto"; // Ensure it's pushed to the right
          } else {
              // Received message styling (gray, left)
              messageElement.style.backgroundColor = "#e9ecef"; // Gray background
              messageElement.style.color = "black";
              messageElement.style.alignSelf = "flex-start"; // Align to the left
              messageElement.style.marginRight = "auto"; // Ensure it's pushed to the left
          }

          messageElement.innerText = msg.text;
          chatHistory.appendChild(messageElement);
      });

      // Scroll to the bottom of chatHistory
      chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  // Position and visibility of the proximity box using PIXI.js
  chatBox.style.left = `${app.screen.width / (RESOLUTION * 2) - boxWidth / 2}px`;
  chatBox.style.top = `${app.screen.height / (RESOLUTION * 2) - boxHeight / 2}px`;

  return {
      chatBox,
      updateChatHistory,
  };
}

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

 /**
 * Proximity check and chat box creation function
 */
function manageProximityAndChatBoxes() {
  // Map to store active chat boxes for each player

  app.ticker.add((time) => {
    TweenJS.update(app.ticker.lastTime);

    if (localPlayer) {
      // Handle player movement based on key inputs
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

      // Check proximity with all other players
      playerSprites.forEach((sprite, player) => {
        if (sprite === localPlayer) return;

        const dx = localPlayer.position.x - sprite.position.x;
        const dy = localPlayer.position.y - sprite.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < PROXIMITY_THRESHOLD) {
          // If close enough, create or update the chat box for this player
          if (!activeChatBoxes.has(player)) {
            console.log("Creating chat box for player: ", player.username);
            const newChatBoxInstance = createProximityBoxInstance(player.username);
            const chatBox = newChatBoxInstance.chatBox;

            // Calculate position for the new chat box
            const boxX = localPlayer.position.x + 30;
            const boxY = localPlayer.position.y - 50;

            // Convert PIXI.js coordinates to screen coordinates
            const rect = app.view.getBoundingClientRect();
            const globalX = rect.left + boxX * RESOLUTION;
            const globalY = rect.top + boxY * RESOLUTION;

            chatBox.style.left = `${globalX}px`;
            chatBox.style.top = `${globalY}px`;

            // Show the chat box and add it to the active chat boxes map
            chatBox.style.visibility = "visible";
            activeChatBoxes.set(player, newChatBoxInstance);

            // Append the new chat box to the document body
            document.body.appendChild(chatBox);
          } else {
            // Update the position of the existing chat box
            const chatBoxInstance = activeChatBoxes.get(player)!;
            const chatBox = chatBoxInstance.chatBox; 
            chatBox.style.visibility = "visible";
            const boxX = localPlayer.position.x + 30;
            const boxY = localPlayer.position.y - 50;

            // Convert PIXI.js coordinates to screen coordinates
            const rect = app.view.getBoundingClientRect();
            const globalX = rect.left + boxX * RESOLUTION;
            const globalY = rect.top + boxY * RESOLUTION;

            chatBox.style.left = `${globalX}px`;
            chatBox.style.top = `${globalY}px`;
          }
        } else {
          // If out of range, remove the chat box for this player
          if (activeChatBoxes.has(player)) {
            const chatBoxInstance = activeChatBoxes.get(player)!;
            const chatBox = chatBoxInstance.chatBox;
            chatBox.style.visibility = "hidden";
          }
        }
      });

      // Send the player's new position to the server
      room.send("move", {
        x: localPlayer.position.x,
        y: localPlayer.position.y,
      });
    }
  });
}

// Call the manageProximityAndChatBoxes function in your game initialization
manageProximityAndChatBoxes();

}