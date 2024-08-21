import React, { useState, useEffect } from 'react';
import * as Colyseus from 'colyseus.js';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Button, Box, Center, Container, Stack, Paper, Text } from '@mantine/core';
import DeveloperPortal from './editor'; // Import the new component

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

  return (
    <header>
      
        <SignedOut>
        <Container style={{ height: '100vh' }}>
          <Center style={{ height: '100%' }}>
            <Paper shadow="xl" p="lg" radius="lg" style={{ backgroundColor: '#fafafa', borderColor: '#ccc' }}>
              <Stack style={{ width: '40vw' }}>
                <Text fw={600} style={{ fontSize: '38px', textAlign: 'center' }}>Find the AI Editor</Text>
                <Box mt={15} ml={15}>
                  <Center>
                    <SignInButton>
                      <Button size="sm">Sign in to the bot editor</Button>
                    </SignInButton>
                  </Center>
                </Box>
              </Stack>
            </Paper>
          </Center>
          
          </Container>
        </SignedOut>

        <SignedIn>
          <DeveloperPortal />
        </SignedIn>
      
    </header>
  )
}
