

import React, { useState } from 'react';
import { Client } from 'colyseus.js';
import { Button, TextInput, Paper, Group, Text, Box, Stack, Title } from '@mantine/core';

import './App.css'

import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';

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
      if (room && userId !== sessionId && privateMessage[userId]?.trim() !== "") {
          const messageText = privateMessage[userId];
          room.send('private_message', { userId, text: messageText });
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
    <MantineProvider>
      <Box sx={{ padding: '20px' }}>
          <Title order={1}>Pokémacchina</Title>
          {room ? (
              <Group align="start" spacing="xl">
                  <Box>
                      <Title order={2}>Connected Users</Title>
                      <Stack spacing="sm">
                          {users.map((user, index) => (
                              <Paper key={index} shadow="xl" radius="xl" withBorder p="xl">
                                  <Text>{user}</Text>
                                  {user !== sessionId && (
                                      <>
                                          <TextInput
                                              placeholder={`Message ${user}`}
                                              value={privateMessage[user] || ""}
                                              onChange={(e) => setPrivateMessage({ ...privateMessage, [user]: e.target.value })}
                                              onKeyPress={(e) => {
                                                  if (e.key === 'Enter') sendPrivateMessage(user);
                                              }}
                                          />
                                          <Button
                                              mt="xs"
                                              size="xs"
                                              variant="light"
                                              onClick={() => sendPrivateMessage(user)}
                                          >
                                              Send Private
                                          </Button>
                                          <Box mt="xs" style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px' }}>
                                              <Text weight={500}>Chat with {user}</Text>
                                              <Stack spacing="xs">
                                                  {(privateChats[user] || []).map((msg, idx) => (
                                                      <Text key={idx} size="sm">{msg}</Text>
                                                  ))}
                                              </Stack>
                                          </Box>
                                      </>
                                  )}
                              </Paper>
                          ))}
                      </Stack>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                      <Title order={2}>Public Chat</Title>
                      <Paper shadow="sm" padding="md" withBorder>
                          <Stack spacing="sm">
                              {messages.map((msg, index) => (
                                  <Box key={index} style={{ padding: '10px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
                                      <Text weight={500}>{msg.user}:</Text>
                                      <Text>{msg.text}</Text>
                                  </Box>
                              ))}
                          </Stack>
                      </Paper>
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
                  </Box>
              </Group>
          ) : (
              <Button onClick={joinRoom}>Join Room</Button>
          )}
      </Box>
      </MantineProvider>
  );
}

export default App;

