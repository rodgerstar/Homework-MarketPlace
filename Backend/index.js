require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { User, Job, Bid } = require('./models');
const { Op } = require('sequelize');

const app = express();

app.use(cors());
app.use(express.json());

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const isSuperadmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Superadmin access required' });
  }
  next();
};

const isClient = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Client access required' });
  }
  next();
};

const isWriter = (req, res, next) => {
  if (req.user.role !== 'writer') {
    return res.status(403).json({ error: 'Writer access required' });
  }
  next();
};

// Helper function to add signed URLs to jobs
const addSignedUrls = async (jobs, token) => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  const jobsWithSignedUrls = await Promise.all(
    jobs.map(async (job) => {
      if (job.pdf_url) {
        const fileName = job.pdf_url.split('/').pop();
        const { data, error } = await supabase.storage
          .from('job-pdfs')
          .createSignedUrl(fileName, 3600);

        if (error) {
          console.error('Error generating signed URL:', error);
          job.pdf_url = null;
        } else {
          job.pdf_url = data.signedUrl;
        }
      }
      return job;
    })
  );

  return jobsWithSignedUrls;
};

const createSuperuser = async () => {
  try {
    const superadminEmail = process.env.SUPABASE_SUPERADMIN_EMAIL;
    const superadminPassword = process.env.SUPABASE_SUPERADMIN_PASSWORD;

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
    console.error('Error in /api/user/role:', error);
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
    console.error('Error in /api/superadmin/add-writer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Superadmin Job Management Endpoints
app.get('/api/superadmin/jobs/pending', authenticateToken, isSuperadmin, async (req, res) => {
  try {
    let jobs = await Job.findAll({
      where: { status: 'in_progress' },
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });

    // Generate signed URLs for PDFs
    jobs = await addSignedUrls(jobs, req.token);

    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/superadmin/jobs/pending:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.patch('/api/superadmin/jobs/:id/approve', authenticateToken, isSuperadmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_bid_amount } = req.body;

    const bidAmount = parseFloat(admin_bid_amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bid amount. Must be a number greater than 0.' });
    }

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'in_progress') {
      return res.status(400).json({ error: 'Only jobs in progress can be approved' });
    }

    await Job.update(
      {
        status: 'approved',
        admin_bid_amount: bidAmount,
        updated_at: new Date(),
      },
      { where: { id } }
    );

    const updatedJob = await Job.findByPk(id, {
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });

    // Generate signed URL for PDF
    if (updatedJob.pdf_url) {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
        global: { headers: { Authorization: `Bearer ${req.token}` } },
      });
      const fileName = updatedJob.pdf_url.split('/').pop();
      const { data, error } = await supabase.storage
        .from('job-pdfs')
        .createSignedUrl(fileName, 3600);

      if (error) {
        console.error('Error generating signed URL:', error);
        updatedJob.pdf_url = null;
      } else {
        updatedJob.pdf_url = data.signedUrl;
      }
    }

    res.json({ message: 'Job approved successfully', job: updatedJob });
  } catch (error) {
    console.error('Error in /api/superadmin/jobs/:id/approve:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.delete('/api/superadmin/jobs/:id', authenticateToken, isSuperadmin, async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'in_progress') {
      return res.status(400).json({ error: 'Only jobs in progress can be cancelled by superadmin' });
    }

    // Initialize Supabase client for PDF deletion
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // Delete PDF if exists
    if (job.pdf_url) {
      const fileName = job.pdf_url.split('/').pop();
      await supabase.storage.from('job-pdfs').remove([fileName]);
    }

    await Job.update(
      { status: 'cancelled', updated_at: new Date() },
      { where: { id } }
    );

    res.json({ message: 'Job cancelled successfully' });
  } catch (error) {
    console.error('Error in /api/superadmin/jobs/:id (DELETE):', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Client Job Management Endpoints
app.post('/api/jobs/post', authenticateToken, isClient, (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { title, description, client_bid_amount } = req.body;
    let pdfUrl = null;

    console.log('Received FormData:', {
      title,
      description,
      client_bid_amount,
      file: req.file ? req.file.originalname : null,
    });

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    const bidAmount = parseFloat(client_bid_amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ error: 'Invalid budget amount. Must be a number greater than 0.' });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const { data, error } = await supabase.storage
        .from('job-pdfs')
        .upload(fileName, req.file.buffer, {
          contentType: 'application/pdf',
        });

      if (error) {
        throw new Error('Failed to upload PDF to Supabase Storage: ' + error.message);
      }

      pdfUrl = `${process.env.SUPABASE_URL}/storage/v1/object/job-pdfs/${fileName}`;
    }

    console.log('Creating job with:', {
      title,
      description,
      client_bid_amount: bidAmount,
      pdf_url: pdfUrl,
      client_id: req.user.id,
      status: 'in_progress',
    });

    const job = await Job.create({
      title,
      description,
      client_bid_amount: bidAmount,
      pdf_url: pdfUrl,
      client_id: req.user.id,
      status: 'in_progress',
    });

    if (pdfUrl) {
      const supabaseWithToken = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
        global: {
          headers: { Authorization: `Bearer ${req.token}` },
        },
      });
      const fileName = pdfUrl.split('/').pop();
      const { data: signedUrlData, error } = await supabaseWithToken.storage
        .from('job-pdfs')
        .createSignedUrl(fileName, 3600);

      if (error) {
        console.error('Error generating signed URL:', error);
        job.pdf_url = null;
      } else {
        job.pdf_url = signedUrlData.signedUrl;
      }
    }

    res.json({ message: 'Job posted successfully', job });
  } catch (error) {
    console.error('Error in /api/jobs/post:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.get('/api/jobs/posted', authenticateToken, isClient, async (req, res) => {
  try {
    let jobs = await Job.findAll({
      where: {
        client_id: req.user.id,
        status: { [Op.ne]: 'cancelled' },
      },
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });

    jobs = await addSignedUrls(jobs, req.token);

    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/jobs/posted:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.get('/api/jobs/completed', authenticateToken, isClient, async (req, res) => {
  try {
    let jobs = await Job.findAll({
      where: { client_id: req.user.id, status: 'completed' },
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });

    jobs = await addSignedUrls(jobs, req.token);

    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/jobs/completed:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.patch('/api/jobs/:id', authenticateToken, isClient, upload, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    let pdfUrl = undefined;

    const job = await Job.findOne({ where: { id, client_id: req.user.id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found or you do not have permission to edit this job' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Only open jobs can be edited' });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const { data, error } = await supabase.storage
        .from('job-pdfs')
        .upload(fileName, req.file.buffer, {
          contentType: 'application/pdf',
        });

      if (error) {
        throw new Error('Failed to upload PDF to Supabase Storage: ' + error.message);
      }

      pdfUrl = `${process.env.SUPABASE_URL}/storage/v1/object/job-pdfs/${fileName}`;

      if (job.pdf_url) {
        const oldFileName = job.pdf_url.split('/').pop();
        await supabase.storage.from('job-pdfs').remove([oldFileName]);
      }
    }

    const updatedData = {};
    if (title) updatedData.title = title;
    if (description) updatedData.description = description;
    if (pdfUrl !== undefined) updatedData.pdf_url = pdfUrl;
    updatedData.updated_at = new Date();

    await Job.update(updatedData, { where: { id } });

    const updatedJob = await Job.findByPk(id);

    if (updatedJob.pdf_url) {
      const supabaseWithToken = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
        global: {
          headers: { Authorization: `Bearer ${req.token}` },
        },
      });
      const fileName = updatedJob.pdf_url.split('/').pop();
      const { data: signedUrlData, error } = await supabaseWithToken.storage
        .from('job-pdfs')
        .createSignedUrl(fileName, 3600);

      if (error) {
        console.error('Error generating signed URL:', error);
        updatedJob.pdf_url = null;
      } else {
        updatedJob.pdf_url = signedUrlData.signedUrl;
      }
    }

    res.json({ message: 'Job updated successfully', job: updatedJob });
  } catch (error) {
    console.error('Error in /api/jobs/:id (PATCH):', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.delete('/api/jobs/:id', authenticateToken, isClient, async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({ where: { id, client_id: req.user.id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found or you do not have permission to cancel this job' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Only open jobs can be cancelled' });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    if (job.pdf_url) {
      const fileName = job.pdf_url.split('/').pop();
      await supabase.storage.from('job-pdfs').remove([fileName]);
    }

    await Job.update({ status: 'cancelled', updated_at: new Date() }, { where: { id } });
    res.json({ message: 'Job cancelled successfully' });
  } catch (error) {
    console.error('Error in /api/jobs/:id (DELETE):', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Writer Endpoints
app.get('/api/jobs/available', authenticateToken, isWriter, async (req, res) => {
  try {
    let jobs = await Job.findAll({
      where: { status: 'approved' },
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });

    jobs = await addSignedUrls(jobs, req.token);

    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/jobs/available:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/jobs/bid', authenticateToken, isWriter, async (req, res) => {
  try {
    const { job_id, amount } = req.body;

    if (!job_id || !amount) {
      return res.status(400).json({ error: 'Job ID and amount are required' });
    }

    const job = await Job.findByPk(job_id);
    if (!job || job.status !== 'approved') {
      return res.status(400).json({ error: 'Job not available for bidding' });
    }

    const existingBid = await Bid.findOne({
      where: { job_id, writer_id: req.user.id },
    });
    if (existingBid) {
      return res.status(400).json({ error: 'You have already bid on this job' });
    }

    const bid = await Job.create({
      job_id,
      writer_id: req.user.id,
      amount,
      status: 'pending',
    });

    res.json({ message: 'Bid placed successfully', bid });
  } catch (error) {
    console.error('Error in /api/jobs/bid:', error);
    res.status(500).json({ error: error.message || 'Server error' });
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
    let jobs = bids.map((bid) => bid.Job);

    jobs = await addSignedUrls(jobs, req.token);

    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/jobs/assigned:', error);
    res.status(500).json({ error: error.message || 'Server error' });
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
    let jobs = bids.map((bid) => bid.Job);

    jobs = await addSignedUrls(jobs, req.token);

    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/jobs/writer/completed:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));