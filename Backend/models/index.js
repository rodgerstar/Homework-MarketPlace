require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.SUPABASE_DB_URI, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
});

// Define models
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.ENUM('client', 'writer', 'admin'),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
}, { tableName: 'users', timestamps: false });

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  writer_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: User, key: 'id' },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  file_extension: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('posted', 'assigned', 'in_progress', 'pending_approval', 'due', 'late', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'posted',
  },
  client_bid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  writer_share: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  expected_return_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
  urgency: {
    type: DataTypes.ENUM('Normal', 'Urgent'),
    allowNull: false,
    defaultValue: 'Normal',
  },
  assignment_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  spacing: {
    type: DataTypes.ENUM('Single', 'Double'),
    allowNull: false,
    defaultValue: 'Double',
  },
  level: {
    type: DataTypes.ENUM('High School', 'Undergraduate', 'Masters', 'PhD'),
    allowNull: false,
    defaultValue: 'Undergraduate',
  },
  language: {
    type: DataTypes.ENUM('English (US)', 'English (UK)'),
    allowNull: false,
  },
  citation_style: {
    type: DataTypes.ENUM('APA', 'MLA', 'Chicago', 'Harvard'),
    allowNull: false,
    defaultValue: 'APA',
  },
  number_of_sources: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  pending_submission_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  submission_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, { tableName: 'jobs', timestamps: false });

const Bid = sequelize.define('Bid', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  job_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  writer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
}, { tableName: 'bids', timestamps: false });

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  job_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  writer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_extension: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, { tableName: 'submissions', timestamps: false });

const Testimonial = sequelize.define('Testimonial', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
}, { tableName: 'testimonials', timestamps: false });

// Relationships
User.hasMany(Job, { foreignKey: 'client_id', as: 'jobs' });
Job.belongsTo(User, { foreignKey: 'client_id', as: 'client' });
User.hasMany(Job, { foreignKey: 'writer_id', as: 'assigned_jobs' });
Job.belongsTo(User, { foreignKey: 'writer_id', as: 'writer' });

Job.hasMany(Bid, { foreignKey: 'job_id', as: 'bids' });
Bid.belongsTo(Job, { foreignKey: 'job_id', as: 'job', constraints: false });

User.hasMany(Bid, { foreignKey: 'writer_id', as: 'bids' });
Bid.belongsTo(User, { foreignKey: 'writer_id', as: 'writer' });

Job.hasMany(Submission, { foreignKey: 'job_id', as: 'submissions' });
Submission.belongsTo(Job, { foreignKey: 'job_id', as: 'job', constraints: false });
User.hasMany(Submission, { foreignKey: 'writer_id', as: 'submissions' });
Submission.belongsTo(User, { foreignKey: 'writer_id', as: 'writer' });

Job.belongsTo(Submission, { foreignKey: 'pending_submission_id', as: 'pendingSubmission', constraints: false });
Job.belongsTo(Submission, { foreignKey: 'submission_id', as: 'approvedSubmission', constraints: false });

User.hasMany(Testimonial, { foreignKey: 'client_id', as: 'testimonials' });
Testimonial.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

// Sync database and create indexes
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    const tables = ['users', 'jobs', 'submissions', 'bids', 'testimonials'];
    const tableStatus = {};

    // Check if tables exist
    for (const table of tables) {
      const [results] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        );
      `);
      tableStatus[table] = results[0].exists;
      if (tableStatus[table]) {
        console.log(`Table ${table} already exists`);
      } else {
        console.log(`Table ${table} does not exist, will create`);
      }
    }

    // Sync tables only if they don't exist
    if (!tableStatus['users']) {
      console.log('Creating User table...');
      await User.sync({ force: false });
      console.log('User table created');
    }

    if (!tableStatus['jobs']) {
      console.log('Creating Job table...');
      await Job.sync({ force: false });
      console.log('Job table created');
    }

    if (!tableStatus['submissions']) {
      console.log('Creating Submission table...');
      await Submission.sync({ force: false });
      console.log('Submission table created');
    }

    if (!tableStatus['bids']) {
      console.log('Creating Bid table...');
      await Bid.sync({ force: false });
      console.log('Bid table created');
    }

    if (!tableStatus['testimonials']) {
      console.log('Creating Testimonial table...');
      await Testimonial.sync({ force: false });
      console.log('Testimonial table created');
    }

    // Add foreign key constraints only if tables are newly created
    if (!tableStatus['jobs'] || !tableStatus['users'] || !tableStatus['submissions'] || !tableStatus['bids'] || !tableStatus['testimonials']) {
      try {
        console.log('Adding foreign key constraints...');
        await sequelize.query(`
          ALTER TABLE jobs
          ADD CONSTRAINT fk_client_id 
          FOREIGN KEY (client_id) 
          REFERENCES users(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE;
        `);
        await sequelize.query(`
          ALTER TABLE jobs
          ADD CONSTRAINT fk_writer_id 
          FOREIGN KEY (writer_id) 
          REFERENCES users(id) 
          ON DELETE SET NULL 
          ON UPDATE CASCADE;
        `);
        await sequelize.query(`
          ALTER TABLE jobs
          ADD CONSTRAINT fk_pending_submission_id 
          FOREIGN KEY (pending_submission_id) 
          REFERENCES submissions(id) 
          ON DELETE SET NULL 
          ON UPDATE CASCADE;
        `);
        await sequelize.query(`
          ALTER TABLE jobs
          ADD CONSTRAINT fk_submission_id 
          FOREIGN KEY (submission_id) 
          REFERENCES submissions(id) 
          ON DELETE SET NULL 
          ON UPDATE CASCADE;
        `);
        await sequelize.query(`
          ALTER TABLE submissions
          ADD CONSTRAINT fk_job_id 
          FOREIGN KEY (job_id) 
          REFERENCES jobs(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE;
        `);
        await sequelize.query(`
          ALTER TABLE submissions
          ADD CONSTRAINT fk_writer_id 
          FOREIGN KEY (writer_id) 
          REFERENCES users(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE;
        `);
        await sequelize.query(`
          ALTER TABLE bids
          ADD CONSTRAINT fk_job_id 
          FOREIGN KEY (job_id) 
          REFERENCES jobs(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE;
        `);
        await sequelize.query(`
          ALTER TABLE bids
          ADD CONSTRAINT fk_writer_id 
          FOREIGN KEY (writer_id) 
          REFERENCES users(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE;
        `);
        await sequelize.query(`
          ALTER TABLE testimonials
          ADD CONSTRAINT fk_client_id 
          FOREIGN KEY (client_id) 
          REFERENCES users(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE;
        `);
        console.log('Foreign key constraints added');
      } catch (err) {
        console.error('Error adding foreign key constraints:', err);
      }
    }

    // Create indexes
    const indexes = [
      { name: 'idx_users_email', table: 'users', column: 'email' },
      { name: 'idx_users_role', table: 'users', column: 'role' },
      { name: 'idx_jobs_client_id', table: 'jobs', column: 'client_id' },
      { name: 'idx_jobs_writer_id', table: 'jobs', column: 'writer_id' },
      { name: 'idx_jobs_status', table: 'jobs', column: 'status' },
      { name: 'idx_jobs_created_at', table: 'jobs', column: 'created_at DESC' },
      { name: 'idx_bids_job_id', table: 'bids', column: 'job_id' },
      { name: 'idx_bids_writer_id', table: 'bids', column: 'writer_id' },
      { name: 'idx_bids_status', table: 'bids', column: 'status' },
      { name: 'idx_submissions_job_id', table: 'submissions', column: 'job_id' },
      { name: 'idx_submissions_writer_id', table: 'submissions', column: 'writer_id' },
      { name: 'idx_submissions_status', table: 'submissions', column: 'status' },
      { name: 'idx_testimonials_client_id', table: 'testimonials', column: 'client_id' },
      { name: 'idx_testimonials_created_at', table: 'testimonials', column: 'created_at DESC' },
    ];

    console.log('Creating indexes...');
    for (const index of indexes) {
      try {
        const [results] = await sequelize.query(`
          SELECT indexname 
          FROM pg_indexes 
          WHERE tablename = '${index.table}' 
          AND indexname = '${index.name}'
        `);

        if (results.length === 0) {
          await sequelize.query(`
            CREATE INDEX ${index.name} ON ${index.table} (${index.column});
          `);
          console.log(`Index ${index.name} created on ${index.table}`);
        } else {
          console.log(`Index ${index.name} already exists on ${index.table}`);
        }
      } catch (err) {
        console.error(`Error creating index ${index.name} on ${index.table}:`, err);
      }
    }

    console.log('Database initialization completed successfully');
  } catch (err) {
    console.error('Error during database initialization:', err);
  }
};

module.exports = { sequelize, User, Job, Bid, Submission, Testimonial, initializeDatabase };