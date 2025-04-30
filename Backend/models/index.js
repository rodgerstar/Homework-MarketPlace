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
  file_extension: { // Added file_extension field
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'assigned', 'due', 'late', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'in_progress',
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
    references: { model: Job, key: 'id' },
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
Bid.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });

User.hasMany(Bid, { foreignKey: 'writer_id', as: 'bids' });
Bid.belongsTo(User, { foreignKey: 'writer_id', as: 'writer' });

User.hasMany(Testimonial, { foreignKey: 'client_id', as: 'testimonials' });
Testimonial.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

// Sync database and create indexes
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');

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
      { name: 'idx_testimonials_client_id', table: 'testimonials', column: 'client_id' },
      { name: 'idx_testimonials_created_at', table: 'testimonials', column: 'created_at DESC' },
    ];

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

    console.log('Indexes setup completed');
  } catch (err) {
    console.error('Error during database initialization:', err);
  }
};

initializeDatabase();

module.exports = { sequelize, User, Job, Bid, Testimonial };