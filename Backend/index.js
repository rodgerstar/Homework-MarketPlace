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

// Helper function to update job status based on expected_return_date
const updateJobStatus = async (job) => {
  if (!job.expected_return_date || job.status === 'completed' || job.status === 'cancelled' || job.status === 'in_progress') {
    return job;
  }

  const now = new Date();
  const returnDate = new Date(job.expected_return_date);
  const dueThreshold = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

  if (now > returnDate && job.status !== 'late') {
    await Job.update({ status: 'late' }, { where: { id: job.id } });
    job.status = 'late';
  } else if (now >= new Date(returnDate - dueThreshold) && job.status === 'assigned') {
    await Job.update({ status: 'due' }, { where: { id: job.id } });
    job.status = 'due';
  }

  return job;
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
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
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
      where: {
        status: 'in_progress',
        admin_bid_amount: null, // Only jobs awaiting superadmin bid
      },
      include: [
        { model: User, as: 'client', attributes: ['name', 'email'] },
        {
          model: Bid,
          as: 'bids',
          where: { status: 'pending' },
          required: false, // Include jobs with or without bids
          include: [{ model: User, as: 'writer', attributes: ['name', 'email'] }],
        },
      ],
    });

    console.log('Pending jobs:', JSON.stringify(jobs, null, 2));
    jobs = await Promise.all(jobs.map(async (job) => await updateJobStatus(job)));
    jobs = await addSignedUrls(jobs, req.token);

    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/superadmin/jobs/pending:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// New endpoint for jobs with pending bids
app.get('/api/superadmin/jobs/with-bids', authenticateToken, isSuperadmin, async (req, res) => {
  try {
    let jobs = await Job.findAll({
      where: {
        status: 'in_progress',
        admin_bid_amount: { [Op.ne]: null }, // Only jobs with superadmin bid set
      },
      include: [
        { model: User, as: 'client', attributes: ['name', 'email'] },
        {
          model: Bid,
          as: 'bids',
          where: { status: 'pending' },
          required: true, // Only jobs with pending bids
          include: [{ model: User, as: 'writer', attributes: ['name', 'email'] }],
        },
      ],
    });

    console.log('Jobs with pending bids:', JSON.stringify(jobs, null, 2));
    jobs = await Promise.all(jobs.map(async (job) => await updateJobStatus(job)));
    jobs = await addSignedUrls(jobs, req.token);

    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/superadmin/jobs/with-bids:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.patch('/api/superadmin/jobs/:id/set-bid', authenticateToken, isSuperadmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_bid_amount, expected_return_date } = req.body;

    const bidAmount = parseFloat(admin_bid_amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bid amount. Must be a number greater than 0.' });
    }

    if (!expected_return_date || isNaN(Date.parse(expected_return_date))) {
      return res.status(400).json({ error: 'Valid expected return date is required.' });
    }

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'in_progress') {
      return res.status(400).json({ error: 'Only jobs in progress can be set for bidding' });
    }

    const clientReturnDate = new Date(job.expected_return_date);
    const writerReturnDate = new Date(expected_return_date);
    if (writerReturnDate > clientReturnDate) {
      return res.status(400).json({ error: 'Writer return date cannot be after client’s expected return date' });
    }

    await Job.update(
      {
        admin_bid_amount: bidAmount,
        expected_return_date: writerReturnDate,
        updated_at: new Date(),
      },
      { where: { id } }
    );

    let updatedJob = await Job.findByPk(id, {
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });

    updatedJob = await updateJobStatus(updatedJob);
    updatedJob = (await addSignedUrls([updatedJob], req.token))[0];

    res.json({ message: 'Bid amount and return date set successfully', job: updatedJob });
  } catch (error) {
    console.error('Error in /api/superadmin/jobs/:id/set-bid:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.get('/api/superadmin/jobs/:jobId/bids', authenticateToken, isSuperadmin, async (req, res) => {
  try {
    const { jobId } = req.params;

    let job = await Job.findByPk(jobId, {
      include: [
        { model: User, as: 'client', attributes: ['name', 'email'] },
        {
          model: Bid,
          as: 'bids',
          include: [{ model: User, as: 'writer', attributes: ['name', 'email'] }],
        },
      ],
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    job = await updateJobStatus(job);
    job = (await addSignedUrls([job], req.token))[0];

    res.json(job);
  } catch (error) {
    console.error('Error in /api/superadmin/jobs/:jobId/bids:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.patch('/api/superadmin/bids/:bidId/assign', authenticateToken, isSuperadmin, async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findByPk(bidId, {
      include: [
        { model: Job, as: 'job' },
        { model: User, as: 'writer', attributes: ['name', 'email'] },
      ],
    });
    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending bids can be assigned' });
    }

    const job = await Job.findByPk(bid.job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await Bid.update(
      { status: 'accepted', updated_at: new Date() },
      { where: { id: bidId } }
    );

    await Job.update(
      { status: 'assigned', writer_id: bid.writer_id, updated_at: new Date() },
      { where: { id: bid.job_id } }
    );

    await Bid.update(
      { status: 'rejected', updated_at: new Date() },
      { where: { job_id: bid.job_id, id: { [Op.ne]: bidId }, status: 'pending' } }
    );

    let updatedJob = await Job.findByPk(bid.job_id, {
      include: [
        { model: User, as: 'client', attributes: ['name', 'email'] },
        { model: User, as: 'writer', attributes: ['name', 'email'] },
      ],
    });

    updatedJob = await updateJobStatus(updatedJob);
    updatedJob = (await addSignedUrls([updatedJob], req.token))[0];

    res.json({ message: 'Writer assigned successfully', job: updatedJob });
  } catch (error) {
    console.error('Error in /api/superadmin/bids/:bidId/assign:', error);
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
    const { title, description, client_bid_amount, expected_return_date } = req.body;
    let pdfUrl = null;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    const bidAmount = parseFloat(client_bid_amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ error: 'Invalid budget amount. Must be a number greater than 0.' });
    }
    if (!expected_return_date || isNaN(Date.parse(expected_return_date))) {
      return res.status(400).json({ error: 'Valid expected return date is required.' });
    }

    const recentJob = await Job.findOne({
      where: {
        client_id: req.user.id,
        title,
        created_at: {
          [Op.gte]: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
    });
    if (recentJob) {
      return res.status(400).json({ error: 'A similar job was recently posted. Please wait before posting again.' });
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

    const job = await Job.create({
      title,
      description,
      client_bid_amount: bidAmount,
      pdf_url: pdfUrl,
      client_id: req.user.id,
      status: 'in_progress',
      expected_return_date: new Date(expected_return_date),
    });

    let updatedJob = await Job.findByPk(job.id, {
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });

    updatedJob = await updateJobStatus(updatedJob);
    updatedJob = (await addSignedUrls([updatedJob], req.token))[0];

    res.json({ message: 'Job posted successfully', job: updatedJob });
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

    jobs = await Promise.all(jobs.map(async (job) => await updateJobStatus(job)));
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

    jobs = await Promise.all(jobs.map(async (job) => await updateJobStatus(job)));
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
    const { title, description, expected_return_date } = req.body;
    let pdfUrl = undefined;

    const job = await Job.findOne({ where: { id, client_id: req.user.id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found or you do not have permission to edit this job' });
    }

    if (job.status !== 'in_progress') {
      return res.status(400).json({ error: 'Only in-progress jobs can be edited' });
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
        const fileName = job.pdf_url.split('/').pop();
        await supabase.storage.from('job-pdfs').remove([fileName]);
      }
    }

    const updatedData = {};
    if (title) updatedData.title = title;
    if (description) updatedData.description = description;
    if (expected_return_date && !isNaN(Date.parse(expected_return_date))) {
      updatedData.expected_return_date = new Date(expected_return_date);
    }
    if (pdfUrl !== undefined) updatedData.pdf_url = pdfUrl;
    updatedData.updated_at = new Date();

    await Job.update(updatedData, { where: { id } });

    let updatedJob = await Job.findByPk(id, {
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });

    updatedJob = await updateJobStatus(updatedJob);
    updatedJob = (await addSignedUrls([updatedJob], req.token))[0];

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

    if (job.status !== 'in_progress') {
      return res.status(400).json({ error: 'Only in-progress jobs can be cancelled' });
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
      where: { status: 'in_progress', admin_bid_amount: { [Op.ne]: null } },
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
      order: [['created_at', 'DESC']],
    });

    const existingBids = await Bid.findAll({
      where: { writer_id: req.user.id },
      attributes: ['job_id'],
    });
    const bidJobIds = existingBids.map((bid) => bid.job_id);

    jobs = jobs.filter((job) => !bidJobIds.includes(job.id));
    jobs = await Promise.all(jobs.map(async (job) => await updateJobStatus(job)));
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

    const bidAmount = parseFloat(amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bid amount. Must be a number greater than 0.' });
    }

    const job = await Job.findByPk(job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'in_progress' || !job.admin_bid_amount) {
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
      amount: bidAmount,
      status: 'pending',
    });

    let updatedJob = await Job.findByPk(job_id, {
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });

    updatedJob = await updateJobStatus(updatedJob);
    updatedJob = (await addSignedUrls([updatedJob], req.token))[0];

    res.json({ message: 'Bid placed successfully', bid, job: updatedJob });
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
          as: 'job',
          where: { status: ['assigned', 'due', 'late'] },
          required: true,
          include: [
            {
              model: User,
              as: 'client',
              attributes: ['name', 'email'],
            },
          ],
        },
      ],
    });
    let jobs = bids.map((bid) => bid.job).filter((job) => job !== null);
    jobs = await Promise.all(jobs.map(async (job) => await updateJobStatus(job)));
    jobs = await addSignedUrls(jobs, req.token);
    console.log('Assigned jobs sent:', JSON.stringify(jobs, null, 2));
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
          as: 'job',
          where: { status: 'completed' },
          include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
        },
      ],
    });
    let jobs = bids.map((bid) => bid.job).filter((job) => job !== null);
    jobs = await Promise.all(jobs.map(async (job) => await updateJobStatus(job)));
    jobs = await addSignedUrls(jobs, req.token);
    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/jobs/writer/completed:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));