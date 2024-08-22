import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Button, Box, Center, Container, Stack, Paper, Text } from '@mantine/core';
import DeveloperPortal from './editor'; // Import the new component

const initialCode = `You are a friendly and helpful bot in a multiplayer game.`;

export default function IndexPage() {


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
