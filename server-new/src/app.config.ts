import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import { auth, JWT } from "@colyseus/auth";
import { createClient } from '@supabase/supabase-js';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://bfawgabxukpfgcecxbmx.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Import your Room files
 */
import { MyRoom } from "./rooms/MyRoom";

export default config({
    initializeGameServer: (gameServer) => {
        gameServer.define('my_room', MyRoom)
            .filterBy(['channelId']);
    },

    initializeExpress: (app) => {
        app.get("/hello_world", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        app.post('/save_pokemon', async (req: Request, res: Response) => {
            const { name, playerId } = req.body;

            if (!name || !playerId) {
                console.error('Pokemon name or player ID missing');
                return res.status(400).send({ error: 'Pokemon name and player ID are required' });
            }

            try {
                const { data, error } = await supabase
                    .from('prompts') 
                    .insert([{ player: playerId, bot_name: name, bot_prompt: '' }]);

                if (error) {
                    console.error('Error inserting Pokémon:', error.message, error.details);
                    throw error;
                }

                res.status(200).send({ success: true });
            } catch (error: any) {
                console.error('Error saving Pokémon:', error.message);
                res.status(500).send({ error: 'Failed to save Pokémon' });
            }
        });

        app.get('/get_pokemons/:playerId', async (req: Request, res: Response) => {
            const { playerId } = req.params;

            if (!playerId) {
                return res.status(400).send({ error: 'Player ID is required' });
            }

            try {
                const { data, error } = await supabase
                    .from('prompts') 
                    .select('*')
                    .eq('player', playerId);

                if (error) {
                    throw error;
                }

                res.status(200).send({ success: true, pokemons: data });
            } catch (error: any) {
                res.status(500).send({ error: 'Failed to retrieve Pokémon' });
            }
        });

        app.post('/update_pokemon_prompt', async (req: Request, res: Response) => {
            const { id, prompt } = req.body;

            if (!id || !prompt) {
                return res.status(400).send({ error: 'Pokemon ID and prompt are required' });
            }

            try {
                const { data, error } = await supabase
                    .from('prompts')
                    .update({ bot_prompt: prompt })
                    .eq('id', id);

                if (error) {
                    throw error;
                }

                res.status(200).send({ success: true });
            } catch (error: any) {
                res.status(500).send({ error: 'Failed to update Pokémon prompt' });
            }
        });

        app.post('/delete_pokemon', async (req: Request, res: Response) => {
            const { id } = req.body;

            if (!id) {
                return res.status(400).send({ error: 'Pokemon ID is required' });
            }

            try {
                const { data, error } = await supabase
                    .from('prompts')
                    .delete()
                    .eq('id', id);

                if (error) {
                    throw error;
                }

                res.status(200).send({ success: true });
            } catch (error: any) {
                res.status(500).send({ error: 'Failed to delete Pokémon' });
            }
        });

        if (process.env.NODE_ENV !== "production") {
            app.use("/", playground);
        }

        app.use("/colyseus", monitor());
    },

    beforeListen: () => {
        console.log('Server is about to start!');
    }
});
