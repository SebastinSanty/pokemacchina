import React, { useState, useEffect } from 'react';
import { Client } from 'colyseus.js';

function App() {
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [users, setUsers] = useState([]);
    const [privateMessage, setPrivateMessage] = useState({});

    const joinRoom = () => {
        const client = new Client('ws://localhost:2567');

        client.joinOrCreate('my_room').then(room => {
            console.log('Joined successfully!', room);
            setRoom(room);

            room.onMessage('chat_message', (messageData) => {
                console.log('Message received:', messageData);
                setMessages(prevMessages => [...prevMessages, messageData]);
            });

            room.onMessage('private_message', (messageData) => {
                console.log('Private message received:', messageData);
                setMessages(prevMessages => [...prevMessages, { user: `${messageData.user} (private)`, text: messageData.text }]);
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
        if (room && privateMessage[userId]?.trim() !== "") {
            room.send('private_message', { userId, text: privateMessage[userId] });
            setPrivateMessage({ ...privateMessage, [userId]: "" });
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
                                <input 
                                    type="text" 
                                    value={privateMessage[user] || ""}
                                    onChange={(e) => setPrivateMessage({ ...privateMessage, [user]: e.target.value })}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') sendPrivateMessage(user);
                                    }}
                                />
                                <button onClick={() => sendPrivateMessage(user)}>Send Private</button>
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
