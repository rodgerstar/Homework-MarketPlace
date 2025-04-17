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
  pdf_url: { // Add column for PDF file path
    type: DataTypes.STRING,
    allowNull: true, // Optional field
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

// Sync database and create indexes
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    await sequelize.sync({ alter: true }); // Use alter: true to add the new column without dropping the table
    console.log('Database synced successfully');

    const indexes = [
      { name: 'idx_users_email', table: 'users', column: 'email' },
      { name: 'idx_users_role', table: 'users', column: 'role' },
      { name: 'idx_jobs_client_id', table: 'jobs', column: 'client_id' },
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