import React, { useState, useEffect } from 'react';
import { Client } from 'colyseus.js';

function App() {
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [users, setUsers] = useState([]);
    const [privateMessage, setPrivateMessage] = useState({});
    const [privateChats, setPrivateChats] = useState({}); // To track private conversations
    const [sessionId, setSessionId] = useState(""); // To store the current user's session ID

    const joinRoom = () => {
        const client = new Client('ws://localhost:2567');

        client.joinOrCreate('my_room').then(room => {
            console.log('Joined successfully!', room);
            setRoom(room);
            setSessionId(room.sessionId); // Store the session ID

            room.onMessage('chat_message', (messageData) => {
                console.log('Message received:', messageData);
                setMessages(prevMessages => [...prevMessages, messageData]);
            });

            room.onMessage('private_message', (messageData) => {
                console.log('Private message received:', messageData);
                
                // Append the message to the private chat with the sender
                setPrivateChats(prevChats => ({
                    ...prevChats,
                    [messageData.user]: [...(prevChats[messageData.user] || []), messageData.text]
                }));
            });

            room.onMessage('player_list', (playerList) => {
                console.log('Player list updated:', playerList);
                setUsers(playerList);
            });
        }).catch(e => {
            console.error('Failed to join', e);
        });
    };

    const sendMessage = () => {
        if (room && message.trim() !== "") {
            room.send('chat_message', message);
            setMessage("");
        }
    };

    const sendPrivateMessage = (userId) => {
        if (room && userId !== sessionId && privateMessage[userId]?.trim() !== "") { // Check if user is not sending to themselves
            const messageText = privateMessage[userId];
            room.send('private_message', { userId, text: messageText });
            
            // Append the message to the private chat with the recipient
            setPrivateChats(prevChats => ({
                ...prevChats,
                [userId]: [...(prevChats[userId] || []), `You: ${messageText}`]
            }));

            setPrivateMessage({ ...privateMessage, [userId]: "" });
        } else {
            console.log("Cannot send private message to yourself.");
        }
    };

    return (
        <div className="App">
            <h1>Chat Application</h1>
            {room ? (
                <div>
                    <h2>Connected Users</h2>
                    <ul>
                        {users.map((user, index) => (
                            <li key={index}>
                                {user}
                                {user !== sessionId && (
                                    <>
                                        <input 
                                            type="text" 
                                            value={privateMessage[user] || ""}
                                            onChange={(e) => setPrivateMessage({ ...privateMessage, [user]: e.target.value })}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') sendPrivateMessage(user);
                                            }}
                                        />
                                        <button onClick={() => sendPrivateMessage(user)}>Send Private</button>
                                        <div className="private-chat-box">
                                            <h4>Chat with {user}</h4>
                                            <div>
                                                {(privateChats[user] || []).map((msg, idx) => (
                                                    <div key={idx}>{msg}</div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                    <div>
                        {messages.map((msg, index) => (
                            <div key={index}>
                                <strong>{msg.user}:</strong> {msg.text}
                            </div>
                        ))}
                    </div>
                    <input 
                        type="text" 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') sendMessage();
                        }}
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            ) : (
                <button onClick={joinRoom}>Join Room</button>
            )}
        </div>
    );
}

export default App;
