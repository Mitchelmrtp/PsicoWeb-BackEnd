import { Sequelize } from 'sequelize';
import 'dotenv/config';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,           // Maximum number of connections in pool
      min: 0,           // Minimum number of connections in pool
      acquire: 30000,   // Maximum time (ms) that pool will try to get connection before throwing error
      idle: 10000       // Maximum time (ms) that a connection can be idle before being released
    },
    retry: {
      max: 3           // Maximum retry attempts when database query fails
    }
  }
);

export default sequelize;
