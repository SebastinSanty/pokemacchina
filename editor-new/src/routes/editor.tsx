import React, { useState, useEffect } from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react'; 
import { Button, Text, Group, AppShell, NavLink, Modal, TextInput, Accordion, Switch, Loader } from '@mantine/core';
import { IconPlus, IconSettings, IconPokeball, IconCheck, IconX } from '@tabler/icons-react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';

import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

import '@mantine/notifications/styles.css';

export default function DeveloperPortal() {
  const { user } = useUser(); 
  const [code, setCode] = useState('');
  const [modalOpened, setModalOpened] = useState(false);
  const [pokemonName, setPokemonName] = useState('');
  const [pokemons, setPokemons] = useState([]); 
  const [loading, setLoading] = useState<number | null>(null); // State to manage loading

  useEffect(() => {
    if (user?.id) {
      fetchPokemons(user.id);
    }
  }, [user]);

  const fetchPokemons = async (playerId) => {
    try {
        const response = await axios.get(`/api/get_pokemons/${playerId}`);
        if (response.data.success) {
            setPokemons(response.data.pokemons); 
        }
    } catch (error) {
        console.error('Failed to fetch Pokémon:', error);
    }
  };

  const handleCodeChange = (value, index) => {
    const updatedPokemons = [...pokemons];
    updatedPokemons[index].bot_prompt = value;
    setPokemons(updatedPokemons);
  };

  const handleNewPokemonClick = () => {
    setModalOpened(true);
  };

  const handleModalClose = () => {
    setModalOpened(false);
  };

  const handleNameChange = (event) => {
    setPokemonName(event.currentTarget.value);
  };

  const handleSavePokemon = async () => {
    try {
      const response = await axios.post('/api/save_pokemon', {
        name: pokemonName,
        playerId: user.id, 
      });

      if (response.data.success) {
        notifications.show({
          title: 'Success',
          message: 'Pokémon created successfully!',
          color: 'green',
          icon: <IconCheck size="1rem" />,
          position: 'bottom-center',
        });
        setModalOpened(false);
        fetchPokemons(user.id);
      }
    } catch (error) {
      console.error('Failed to save Pokémon:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create Pokémon. Please try again.',
        color: 'red',
        icon: <IconX size="1rem" />,
        position: 'bottom-center',
      });
    }
  };

  const handleSaveInstruction = async (pokemon, index) => {
    setLoading(index); // Start loading for the specific Pokémon
    try {
      const response = await axios.post('/api/update_pokemon_prompt', {
        id: pokemon.id,
        prompt: pokemon.bot_prompt,
      });

      if (response.data.success) {
        notifications.show({
          title: 'Success',
          message: 'Instruction saved successfully!',
          color: 'green',
          icon: <IconCheck size="1rem" />,
          position: 'bottom-center',
        });
        fetchPokemons(user.id); 
      }
    } catch (error) {
      console.error('Failed to save instruction:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save instruction. Please try again.',
        color: 'red',
        icon: <IconX size="1rem" />,
        position: 'bottom-center',
      });
    } finally {
      setLoading(null); // Stop loading after the action is complete
    }
  };

  const handleDeletePokemon = async (pokemonId) => {
    try {
      const response = await axios.post('/api/delete_pokemon', {
        id: pokemonId,
      });

      if (response.data.success) {
        notifications.show({
          title: 'Success',
          message: 'Pokémon deleted successfully!',
          color: 'green',
          icon: <IconCheck size="1rem" />,
          position: 'bottom-center',
        });
        fetchPokemons(user.id); 
      }
    } catch (error) {
      console.error('Failed to delete Pokémon:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete Pokémon. Please try again.',
        color: 'red',
        icon: <IconX size="1rem" />,
        position: 'bottom-center',
      });
    }
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 200,
        breakpoint: 'sm',
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group gap={30} mt={15} ml={15}>
          <Text size="xl" fw={600}>Find the AI: Developer Portal</Text>
          <SignOutButton>
            <Button size="xs" variant="outline" color="gray">Sign Out</Button>
          </SignOutButton>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          label="Pokemons"
          leftSection={<IconPokeball size="1rem" stroke={1.5} />}
        />
        <NavLink
          label="Account Settings"
          leftSection={<IconSettings size="1rem" stroke={1.5} />}
          disabled
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Button 
          leftSection={<IconPlus size={14} />} 
          variant="default" 
          onClick={handleNewPokemonClick}
        >
          New Pokemon
        </Button>

        <Modal
          opened={modalOpened}
          onClose={handleModalClose}
          title="Create New Pokemon"
        >
          <TextInput
            label="Pokemon Name"
            placeholder="Enter the name"
            value={pokemonName}
            onChange={handleNameChange}
          />
          <Group mt="md">
            <Button onClick={handleModalClose}>Cancel</Button>
            <Button variant="filled" onClick={handleSavePokemon}>
              Save
            </Button>
          </Group>
        </Modal>

        <div>
          <h3>Your Pokémons</h3>
          <Accordion>
            {pokemons.map((pokemon, index) => (
              <Accordion.Item key={index} value={`pokemon-${index}`}>
                <Accordion.Control><Text fw={700}>{pokemon.bot_name}</Text></Accordion.Control>
                <Accordion.Panel>
                  <Text mb={10}>Modify the prompt</Text>
                  <CodeMirror 
                    value={pokemon.bot_prompt} 
                    height="100px"
                    theme={vscodeDark}
                    onChange={(value) => handleCodeChange(value, index)}
                  />
                  <Group mt={10} justify='space-between'>
                    <Group>
                      <Button 
                        variant="filled" 
                        mt={10} 
                        onClick={() => handleSaveInstruction(pokemon, index)}
                        loading={loading === index}
                      >
                        Save Instruction
                      </Button> 
                      <Switch
                        defaultChecked
                        label="Live"
                        disabled
                      />
                    </Group>
                    <Button variant="light" mt={10} color="red" onClick={() => handleDeletePokemon(pokemon.id)}>Delete Pokemon</Button>
                  </Group>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </AppShell.Main>
    </AppShell>
  );
}
