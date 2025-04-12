require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Job, Bid } = require('./models');

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
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

// Middleware to check if user is client
const isClient = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Client access required' });
  }
  next();
};

// Middleware to check if user is writer
const isWriter = (req, res, next) => {
  if (req.user.role !== 'writer') {
    return res.status(403).json({ error: 'Writer access required' });
  }
  next();
};

// Create superuser on startup
const createSuperuser = async () => {
  try {
    const superadminEmail = process.env.SUPERADMIN_EMAIL;
    const superadminPassword = process.env.SUPERADMIN_PASSWORD;

    if (!superadminEmail || !superadminPassword) {
      console.error('Superadmin email or password not defined in .env');
      return;
    }

    const existingSuperadmin = await User.findOne({ where: { email: superadminEmail } });
    if (!existingSuperadmin) {
      const hashedPassword = await bcrypt.hash(superadminPassword, 10);
      await User.create({
        email: superadminEmail,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'admin',
      });
      console.log('Superadmin created:', superadminEmail);
    } else {
      console.log('Superadmin already exists:', superadminEmail);
    }
  } catch (error) {
    console.error('Error creating superadmin:', error);
  }
};

createSuperuser();

app.get('/', (req, res) => res.send('Professor Ann Backend'));

app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

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
    console.log('Login attempt:', { email });
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({ error: 'Invalid password' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

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

app.post('/api/superadmin/add-writer', authenticateToken, isSuperadmin, async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

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

// Job Management Endpoints
app.post('/api/jobs/post', authenticateToken, isClient, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const job = await Job.create({
      title,
      description,
      client_id: req.user.id,
      status: 'open',
    });

    res.json({ message: 'Job posted successfully', job });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/jobs/posted', authenticateToken, isClient, async (req, res) => {
  try {
    const jobs = await Job.findAll({
      where: { client_id: req.user.id, status: 'open' },
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/jobs/completed', authenticateToken, isClient, async (req, res) => {
  try {
    const jobs = await Job.findAll({
      where: { client_id: req.user.id, status: 'completed' },
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Writer Endpoints
app.get('/api/jobs/available', authenticateToken, isWriter, async (req, res) => {
  try {
    const jobs = await Job.findAll({
      where: { status: 'open' },
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/jobs/bid', authenticateToken, isWriter, async (req, res) => {
  try {
    const { job_id, amount } = req.body;

    if (!job_id || !amount) {
      return res.status(400).json({ error: 'Job ID and amount are required' });
    }

    const job = await Job.findByPk(job_id);
    if (!job || job.status !== 'open') {
      return res.status(400).json({ error: 'Job not available for bidding' });
    }

    const existingBid = await Bid.findOne({
      where: { job_id, writer_id: req.user.id },
    });
    if (existingBid) {
      return res.status(400).json({ error: 'You have already bid on this job' });
    }

    const bid = await Bid.create({
      job_id,
      writer_id: req.user.id,
      amount,
      status: 'pending',
    });

    res.json({ message: 'Bid placed successfully', bid });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/jobs/assigned', authenticateToken, isWriter, async (req, res) => {
  try {
    const bids = await Bid.findAll({
      where: { writer_id: req.user.id, status: 'accepted' },
      include: [
        {
          model: Job,
          where: { status: 'assigned' },
          include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
        },
      ],
    });
    const jobs = bids.map((bid) => bid.Job);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/jobs/writer/completed', authenticateToken, isWriter, async (req, res) => {
  try {
    const bids = await Bid.findAll({
      where: { writer_id: req.user.id, status: 'accepted' },
      include: [
        {
          model: Job,
          where: { status: 'completed' },
          include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
        },
      ],
    });
    const jobs = bids.map((bid) => bid.Job);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));