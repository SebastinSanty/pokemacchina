import React, { useState, useEffect } from 'react';
import { AppShell, Textarea, Button, } from '@mantine/core';
import * as Colyseus from 'colyseus.js';

const initialCode = `You are a friendly and helpful bot in a multiplayer game.`;

const Editor: React.FC = () => {
  const [code, setCode] = useState(initialCode);
  const client = new Colyseus.Client('ws://localhost:2567'); // Adjust the WebSocket URL if needed
  const [room, setRoom] = useState<Colyseus.Room | null>(null);

  useEffect(() => {
    // Join the room as an editor client as soon as the component mounts
    const joinRoom = async () => {
      const joinedRoom = await client.joinOrCreate('my_room', { isEditor: true });
      setRoom(joinedRoom);
    };

    joinRoom();

    // Cleanup function to leave the room when the component unmounts
    return () => {
      if (room) {
        room.leave();
      }
    };
  }, []);

  const handleCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(event.currentTarget.value);
  };

  const handleRunCode = async () => {
    console.log('Running code:', code);
    if (room) {
      // Send the updated prompt to the server
      room.send('update_prompt', { prompt: code });
    }
  };

  return (
    <AppShell
      padding="md"
    >

      <Textarea
        placeholder="Write your prompt here..."
        value={code}
        onChange={handleCodeChange}
        minRows={10}
        autosize
      />
      <Button onClick={handleRunCode}>Run Code</Button>
    </AppShell>
  );
};

export default Editor;
