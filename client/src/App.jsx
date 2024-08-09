import React, { useState } from 'react';
import { Client } from 'colyseus.js';
import { Button, TextInput, Paper, Group, Text, Box, Stack, Title, Grid } from '@mantine/core';

import './App.css'

import '@mantine/core/styles.css';

import { createTheme, MantineProvider } from '@mantine/core';

function App() {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [privateMessage, setPrivateMessage] = useState({});
  const [privateChats, setPrivateChats] = useState({});
  const [sessionId, setSessionId] = useState("");

  const joinRoom = () => {
      const client = new Client('ws://localhost:2567');

      client.joinOrCreate('my_room').then(room => {
          console.log('Joined successfully!', room);
          setRoom(room);
          setSessionId(room.sessionId);

          room.onMessage('chat_message', (messageData) => {
              console.log('Message received:', messageData);
              setMessages(prevMessages => [...prevMessages, messageData]);
          });

          room.onMessage('private_message', (messageData) => {
              console.log('Private message received:', messageData);
              setPrivateChats(prevChats => ({
                  ...prevChats,
                  [messageData.user]: [...(prevChats[messageData.user] || []), { user: messageData.user, text: messageData.text }]
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
          room.send('chat_message', { user: sessionId, text: message });
          setMessage("");
      }
  };

  const sendPrivateMessage = (userId) => {
      if (room && userId !== sessionId && privateMessage[userId]?.trim() !== "") {
          const messageText = privateMessage[userId];
          room.send('private_message', { userId, text: messageText });
          setPrivateChats(prevChats => ({
              ...prevChats,
              [userId]: [...(prevChats[userId] || []), { user: sessionId, text: messageText }]
          }));
          setPrivateMessage({ ...privateMessage, [userId]: "" });
      } else {
          console.log("Cannot send private message to yourself.");
      }
  };

  return (
    <MantineProvider>
      <Box >
          <Title order={1}>Pokémacchina</Title>
          {room ? (
              <>
                  <Box mt={20}>
                      <Title order={2}>People</Title>
                      <Grid my={10}>
                          {users.map((user, index) => (
                            user !== sessionId && (
                            <Grid.Col span={3} key={index}>
                              <Paper shadow="xl" radius="md" withBorder p="sm">
                                  <Box mt="xs" style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px' }}>
                                      <Text weight={500}>Talk with {user}</Text>
                                      <Stack spacing="xs">
                                          {(privateChats[user] || []).map((msg, idx) => (
                                              <Box key={idx} style={{
                                                  padding: '10px',
                                                  backgroundColor: msg.user === sessionId ? '#0084ff' : '#e9ecef',
                                                  color: msg.user === sessionId ? 'white' : 'black',
                                                  borderRadius: '10px',
                                                  alignSelf: msg.user === sessionId ? 'flex-end' : 'flex-start',
                                                  maxWidth: '80%',
                                                  marginBottom: '5px'
                                              }}>
                                                  <Text size="sm">{msg.text}</Text>
                                              </Box>
                                          ))}
                                      </Stack>
                                      <Group mt="md">
                                        <TextInput
                                            placeholder={`Message ${user}`}
                                            value={privateMessage[user] || ""}
                                            onChange={(e) => setPrivateMessage({ ...privateMessage, [user]: e.target.value })}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') sendPrivateMessage(user);
                                            }}
                                            style={{ flex: 1 }}
                                        />
                                        <Button
                                            size="sm"
                                            variant="light"
                                            onClick={() => sendPrivateMessage(user)}
                                        >
                                            Send
                                        </Button>
                                      </Group>
                                  </Box>
                              </Paper>
                              </Grid.Col>
                            )
                          ))}
                      </Grid>
                  </Box>

                  <Box  mt={20} sx={{ flex: 1 }}>
                      <Title order={2}>Public Chat</Title>
                      <Paper shadow="xl" radius="md" withBorder p="sm" >
                          <Stack spacing="sm">
                              {messages.map((msg, index) => (
                                  <Box key={index} style={{
                                      padding: '10px',
                                      backgroundColor: msg.user === sessionId ? '#0084ff' : '#e9ecef',
                                      color: msg.user === sessionId ? 'white' : 'black',
                                      borderRadius: '10px',
                                      alignSelf: msg.user === sessionId ? 'flex-end' : 'flex-start',
                                      maxWidth: '80%',
                                      marginBottom: '5px'
                                  }}>
                                      <Text weight={500}>{msg.user}:</Text>
                                      <Text>{msg.text}</Text>
                                  </Box>
                              ))}
                          </Stack>
                          <Group mt="md">
                          <TextInput
                              placeholder="Type your message"
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              onKeyPress={(e) => {
                                  if (e.key === 'Enter') sendMessage();
                              }}
                              style={{ flex: 1 }}
                          />
                          <Button onClick={sendMessage}>Send</Button>
                      </Group>
                      </Paper>
                      
                  </Box>
              </>
          ) : (
              <Button onClick={joinRoom}>Join Room</Button>
          )}
      </Box>
    </MantineProvider>
  )

}

export default App;
