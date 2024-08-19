// import { Link } from 'react-router-dom'
import React, { useState, useEffect } from 'react';
import * as Colyseus from 'colyseus.js';

import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton } from '@clerk/clerk-react'
import { Button, Box, Group, Text, Center, Container, Stack, Paper } from '@mantine/core'
import { IconPlayerPlay } from '@tabler/icons-react'

import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

const initialCode = `You are a friendly and helpful bot in a multiplayer game.`;

export default function IndexPage() {

  const [code, setCode] = useState(initialCode);
  const client = new Colyseus.Client('/api'); // Adjust the WebSocket URL if needed
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

  const handleCodeChange = (value: string) => {
    setCode(value);
  };
  
  const handleRunCode = async () => {
    console.log('Running code:', code);
    if (room) {
      // Send the updated prompt to the server
      room.send('update_prompt', { prompt: code });
    }
  };


  return (
    <header>
      <Container style={{ height: '100vh' }}>
      <Center style={{ height: '100%' }}>
      <Paper shadow="xl" p="lg" radius="lg" style={{ backgroundColor: '#fafafa', borderColor: '#ccc' }}>
      <Stack style={{ width: '40vw' }}>
      <Text fw={600} style={{ fontSize: '38px', textAlign: 'center' }}>Find the AI Editor</Text>
      <SignedOut>
        <Box mt={15} ml={15}>
        <Center>
          <SignInButton>
            <Button size="sm">Sign in to the bot editor</Button>
          </SignInButton>
          </Center>
        </Box>
      </SignedOut>
      <SignedIn>
            <Center>
            <Group>
              <SignOutButton>
                <Button size="xs" variant="outline" color="gray">Sign Out</Button>
              </SignOutButton>
              <UserButton />
          </Group>
          </Center>
        <CodeMirror 
        value={code}
        onChange={handleCodeChange}
        height="100px"
        theme={vscodeDark}
      />
      <Center>
        <Button
          size="sm"
          leftSection={<IconPlayerPlay size={14}/>} 
          onClick={handleRunCode}
        >
          Run Code
        </Button>
      </Center>
      
      </SignedIn>
      </Stack>
      </Paper>
      </Center>
      </Container>
    </header>
  )
}