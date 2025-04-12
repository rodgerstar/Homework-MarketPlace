require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('./models');

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is superadmin
const isSuperadmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Superadmin access required' });
  }
  next();
};

app.get('/', (req, res) => res.send('Professor Ann Backend'));

app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Restrict signup to clients only
    if (role !== 'client') {
      return res.status(400).json({ error: 'Only clients can sign up' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
    });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role });
  } catch (error) {
    res.status(400).json({ error: 'Email already exists or invalid role' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email }); // Add logging
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found:', email); // Add logging
      return res.status(400).json({ error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', email); // Add logging
      return res.status(400).json({ error: 'Invalid password' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role });
  } catch (error) {
    console.error('Login error:', error); // Add logging
    res.status(500).json({ error: 'Server error' });
  }
});

// Endpoint to fetch the logged-in user's role
app.get('/api/user/role', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Superadmin endpoint to add a writer
app.post('/api/superadmin/add-writer', authenticateToken, isSuperadmin, async (req, res) => {
  try {
    const { email, name, password } = req.body;

    // Validate input
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const writer = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'writer',
    });

    res.json({ message: 'Writer added successfully', writer: { id: writer.id, email: writer.email, name: writer.name } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));