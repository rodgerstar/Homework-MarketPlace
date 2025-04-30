require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { sequelize, User, Job, Bid, Submission, Testimonial, initializeDatabase } = require('./models');
const { Op } = require('sequelize');

const app = express();

app.use(cors());
app.use(express.json());

// Configure multer to store files in memory and allow multiple file types
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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
const addSignedUrls = async (jobs) => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const jobsWithSignedUrls = await Promise.all(
    jobs.map(async (job) => {
      const jobData = job.get ? job.get({ plain: true }) : job;
      if (jobData.file_url) {
        const fileName = jobData.file_url.split('/').pop();
        const { data, error } = await supabase.storage
          .from('job-files')
          .createSignedUrl(fileName, 3600);

        if (error) {
          console.error('Error generating signed URL:', error);
          console.log('Preserving original file_url:', jobData.file_url);
        } else {
          jobData.file_url = data.signedUrl;
          console.log('Generated signed URL:', jobData.file_url);
        }
      }
      return jobData;
    })
  );

  return jobsWithSignedUrls;
};

// Helper function to update job status based on expected_return_date
const updateJobStatus = async (job) => {
  if (!job.expected_return_date || job.status === 'completed' || job.status === 'cancelled' || job.status === 'posted') {
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

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase(); // Create tables if they don't exist
    await createSuperuser(); // Create superadmin if not exist
    app.listen(5000, () => {
      console.log('Server running on port 5000');
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

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

// New Profile Endpoint
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.id },
      attributes: ['name', 'role', 'email', 'phone'],
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      name: user.name || 'Unknown',
      role: user.role,
      email: user.email,
      phone: user.phone || 'N/A',
    });
  } catch (error) {
    console.error('Error in /api/user/profile:', error);
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
        status: 'posted',
      },
      include: [
        { model: User, as: 'client', attributes: ['name', 'email'] },
        {
          model: Bid,
          as: 'bids',
          where: { status: 'pending' },
          required: false,
          include: [{ model: User, as: 'writer', attributes: ['name', 'email'] }],
        },
      ],
    });

    console.log('Pending jobs:', JSON.stringify(jobs, null, 2));
    jobs = await Promise.all(jobs.map(async (job) => await updateJobStatus(job)));
    jobs = await addSignedUrls(jobs);

    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/superadmin/jobs/pending:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// New endpoint for jobs with pending applications
app.get('/api/superadmin/jobs/with-applications', authenticateToken, isSuperadmin, async (req, res) => {
  try {
    let jobs = await Job.findAll({
      where: {
        status: 'posted',
      },
      include: [
        { model: User, as: 'client', attributes: ['name', 'email'] },
        {
          model: Bid,
          as: 'bids',
          where: { status: 'pending' },
          required: true,
          include: [{ model: User, as: 'writer', attributes: ['name', 'email'] }],
        },
      ],
    });

    console.log('Jobs with pending applications:', JSON.stringify(jobs, null, 2));
    jobs = await Promise.all(jobs.map(async (job) => await updateJobStatus(job)));
    jobs = await addSignedUrls(jobs);

    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/superadmin/jobs/with-applications:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.get('/api/superadmin/jobs/:jobId/applications', authenticateToken, isSuperadmin, async (req, res) => {
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
    job = (await addSignedUrls([job]))[0];

    res.json(job);
  } catch (error) {
    console.error('Error in /api/superadmin/jobs/:jobId/applications:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.patch('/api/superadmin/applications/:applicationId/assign', authenticateToken, isSuperadmin, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Bid.findByPk(applicationId, {
      include: [
        { model: Job, as: 'job' },
        { model: User, as: 'writer', attributes: ['name', 'email'] },
      ],
    });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending applications can be assigned' });
    }

    const job = await Job.findByPk(application.job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await Bid.update(
      { status: 'accepted', updated_at: new Date() },
      { where: { id: applicationId } }
    );

    await Job.update(
      { status: 'assigned', writer_id: application.writer_id, updated_at: new Date() },
      { where: { id: application.job_id } }
    );

    await Bid.update(
      { status: 'rejected', updated_at: new Date() },
      { where: { job_id: application.job_id, id: { [Op.ne]: applicationId }, status: 'pending' } }
    );

    let updatedJob = await Job.findByPk(application.job_id, {
      include: [
        { model: User, as: 'client', attributes: ['name', 'email'] },
        { model: User, as: 'writer', attributes: ['name', 'email'] },
      ],
    });

    updatedJob = await updateJobStatus(updatedJob);
    updatedJob = (await addSignedUrls([updatedJob]))[0];

    res.json({ message: 'Writer assigned successfully', job: updatedJob });
  } catch (error) {
    console.error('Error in /api/superadmin/applications/:applicationId/assign:', error);
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
    const {
      description,
      client_bid_amount,
      expected_return_date,
      urgency,
      assignment_type,
      subject,
      quantity,
      spacing,
      level,
      language,
      citation_style,
      number_of_sources,
    } = req.body;
    let fileUrl = null;
    let fileExtension = null;

    // Validation checks
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    const bidAmount = parseFloat(client_bid_amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ error: 'Invalid budget amount. Must be a number greater than 0.' });
    }
    if (!expected_return_date || isNaN(Date.parse(expected_return_date))) {
      return res.status(400).json({ error: 'Valid expected return date is required.' });
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      return res.status(400).json({ error: 'Invalid quantity. Must be greater than 0.' });
    }
    if (!urgency || !assignment_type || !spacing || !level || !language || !citation_style) {
      return res.status(400).json({ error: 'All job details are required.' });
    }
    if (number_of_sources && (isNaN(number_of_sources) || parseInt(number_of_sources) < 0)) {
      return res.status(400).json({ error: 'Invalid number of sources.' });
    }

    const recentJob = await Job.findOne({
      where: {
        client_id: req.user.id,
        description,
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
      console.log('File received:', req.file.originalname, req.file.mimetype);
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const { data, error } = await supabase.storage
        .from('job-files')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error('Failed to upload file to Supabase Storage: ' + error.message);
      }

      console.log('Supabase upload response:', data);
      fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/job-files/${fileName}`;
      fileExtension = req.file.originalname.split('.').pop();
      console.log('Constructed fileUrl:', fileUrl, 'File extension:', fileExtension);
    } else {
      console.log('No file uploaded');
    }

    const writerShare = bidAmount / 3;

    const job = await Job.create({
      description,
      client_bid_amount: bidAmount,
      writer_share: writerShare,
      file_url: fileUrl,
      file_extension: fileExtension,
      client_id: req.user.id,
      status: 'posted',
      expected_return_date: new Date(expected_return_date),
      urgency,
      assignment_type,
      subject,
      quantity: parseFloat(quantity),
      spacing,
      level,
      language,
      citation_style,
      number_of_sources: parseInt(number_of_sources) || 0,
    });

    console.log('Job created with file_url:', job.file_url, 'file_extension:', job.file_extension);

    let updatedJob = await Job.findByPk(job.id, {
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });

    console.log('Fetched job after creation:', updatedJob.file_url, updatedJob.file_extension);

    updatedJob = await updateJobStatus(updatedJob);
    updatedJob = (await addSignedUrls([updatedJob]))[0];

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
    jobs = await addSignedUrls(jobs);

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
    jobs = await addSignedUrls(jobs);

    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/jobs/completed:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.patch('/api/jobs/:id', authenticateToken, isClient, upload, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, expected_return_date } = req.body;
    let fileUrl = undefined;
    let fileExtension = undefined;

    const job = await Job.findOne({ where: { id, client_id: req.user.id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found or you do not have permission to edit this job' });
    }

    if (job.status !== 'posted') {
      return res.status(400).json({ error: 'Only posted jobs can be edited' });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const { data, error } = await supabase.storage
        .from('job-files')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (error) {
        throw new Error('Failed to upload file to Supabase Storage: ' + error.message);
      }

      fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/job-files/${fileName}`;
      fileExtension = req.file.originalname.split('.').pop();

      if (job.file_url) {
        const fileName = job.file_url.split('/').pop();
        await supabase.storage.from('job-files').remove([fileName]);
      }
    }

    const updatedData = {};
    if (description) updatedData.description = description;
    if (expected_return_date && !isNaN(Date.parse(expected_return_date))) {
      updatedData.expected_return_date = new Date(expected_return_date);
    }
    if (fileUrl !== undefined) updatedData.file_url = fileUrl;
    if (fileExtension !== undefined) updatedData.file_extension = fileExtension;
    updatedData.updated_at = new Date();

    await Job.update(updatedData, { where: { id } });

    let updatedJob = await Job.findByPk(id, {
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });

    updatedJob = await updateJobStatus(updatedJob);
    updatedJob = (await addSignedUrls([updatedJob]))[0];

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

    if (job.status !== 'posted') {
      return res.status(400).json({ error: 'Only posted jobs can be cancelled' });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    if (job.file_url) {
      const fileName = job.file_url.split('/').pop();
      await supabase.storage.from('job-files').remove([fileName]);
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
      where: { status: 'posted' },
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
      order: [['created_at', 'DESC']],
    });

    const existingApplications = await Bid.findAll({
      where: { writer_id: req.user.id },
      attributes: ['job_id'],
    });
    const applicationJobIds = existingApplications.map((application) => application.job_id);

    jobs = jobs.filter((job) => !applicationJobIds.includes(job.id));
    jobs = await Promise.all(jobs.map(async (job) => await updateJobStatus(job)));
    jobs = await addSignedUrls(jobs);

    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/jobs/available:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/jobs/apply', authenticateToken, isWriter, async (req, res) => {
  try {
    const { job_id } = req.body;

    if (!job_id) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const job = await Job.findByPk(job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'posted') {
      return res.status(400).json({ error: 'Job not available for application' });
    }

    const existingApplication = await Bid.findOne({
      where: { job_id, writer_id: req.user.id },
    });
    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    const application = await Bid.create({
      job_id,
      writer_id: req.user.id,
      status: 'pending',
    });

    let updatedJob = await Job.findByPk(job_id, {
      include: [{ model: User, as: 'client', attributes: ['name', 'email'] }],
    });

    updatedJob = await updateJobStatus(updatedJob);
    updatedJob = (await addSignedUrls([updatedJob]))[0];

    res.json({ message: 'Application submitted successfully', application, job: updatedJob });
  } catch (error) {
    console.error('Error in /api/jobs/apply:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.get('/api/jobs/assigned', authenticateToken, isWriter, async (req, res) => {
  try {
    const applications = await Bid.findAll({
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
    let jobs = applications.map((application) => application.job).filter((job) => job !== null);
    jobs = await Promise.all(jobs.map(async (job) => await updateJobStatus(job)));
    jobs = await addSignedUrls(jobs);
    console.log('Assigned jobs sent:', JSON.stringify(jobs, null, 2));
    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/jobs/assigned:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.get('/api/jobs/writer/completed', authenticateToken, isWriter, async (req, res) => {
  try {
    const applications = await Bid.findAll({
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
    let jobs = applications.map((application) => application.job).filter((job) => job !== null);
    jobs = await Promise.all(jobs.map(async (job) => await updateJobStatus(job)));
    jobs = await addSignedUrls(jobs);
    res.json(jobs);
  } catch (error) {
    console.error('Error in /api/jobs/writer/completed:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});