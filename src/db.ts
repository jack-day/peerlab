import { Pool, types } from 'pg';
import config from './config';

/** DB Connection */
const conn = new Pool({
    host: config.db.host,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    statement_timeout: 5000,
});
export default conn;

// Set queries to return numbers instead of strings for INT and DECIMAL data types
types.setTypeParser(20, (value: any) => parseInt(value, 10));
types.setTypeParser(1700, (value: any) => parseFloat(value));
