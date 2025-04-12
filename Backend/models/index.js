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
});

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
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('open', 'assigned', 'completed', 'cancelled'),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
});

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
  amount: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
});

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
});

// Relationships
User.hasMany(Job, { foreignKey: 'client_id' });
Job.belongsTo(User, { foreignKey: 'client_id' });

Job.hasMany(Bid, { foreignKey: 'job_id' });
Bid.belongsTo(Job, { foreignKey: 'job_id' });

User.hasMany(Bid, { foreignKey: 'writer_id' });
Bid.belongsTo(User, { foreignKey: 'writer_id' });

User.hasMany(Testimonial, { foreignKey: 'client_id' });
Testimonial.belongsTo(User, { foreignKey: 'client_id' });

// Sync database and create indexes after tables are created
sequelize.sync({ force: true }).then(async () => {
  console.log('Database synced');

  // Create indexes after tables are created
  try {
    await sequelize.query(`
      CREATE INDEX idx_users_email ON users (email);
      CREATE INDEX idx_users_role ON users (role);
      CREATE INDEX idx_jobs_client_id ON jobs (client_id);
      CREATE INDEX idx_jobs_status ON jobs (status);
      CREATE INDEX idx_jobs_created_at ON jobs (created_at DESC);
      CREATE INDEX idx_bids_job_id ON bids (job_id);
      CREATE INDEX idx_bids_writer_id ON bids (writer_id);
      CREATE INDEX idx_bids_status ON bids (status);
      CREATE INDEX idx_testimonials_client_id ON testimonials (client_id);
      CREATE INDEX idx_testimonials_created_at ON testimonials (created_at DESC);
    `);
    console.log('Indexes created');
  } catch (err) {
    console.error('Error creating indexes:', err);
  }
}).catch((err) => {
  console.error('Error syncing database:', err);
});

module.exports = { sequelize, User, Job, Bid, Testimonial };