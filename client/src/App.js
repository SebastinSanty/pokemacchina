import React, { useState, useEffect } from 'react';
import { Client } from 'colyseus.js';

function App() {
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");

    const joinRoom = () => {
        const client = new Client('ws://localhost:2567');

        client.joinOrCreate('my_room').then(room => {
            console.log('Joined successfully!', room);
            setRoom(room);

            room.onMessage('chat_message', (message) => {
                console.log('Message received:', message);
                setMessages(prevMessages => [...prevMessages, message]);
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

    return (
        <div className="App">
            <h1>Chat Application</h1>
            {room ? (
                <div>
                    <div>
                        {messages.map((msg, index) => (
                            <div key={index}>{msg}</div>
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