import { Router } from 'express';
import supabase from '../config/supabaseClient.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  const token = data.session?.access_token;
  if (!token) {
    return res.status(201).json({ message: 'Registration successful. Please confirm your email before logging in.' });
  }
  res.status(201).json({ token });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });
  res.json({ token: data.session.access_token });
});

export default router;
