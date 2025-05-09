"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.getTableColumns = getTableColumns;
const pg_1 = require("pg");
const config_1 = require("./config");
const dotenv = require('dotenv');
dotenv.config();
console.log('Attempting to connect to database with connection string:', config_1.config.database.connectionString.replace(/:[^:@]*@/, ':****@'));
exports.pool = new pg_1.Pool({
    connectionString: config_1.config.database.connectionString,
    ssl: config_1.config.database.ssl
});
// Test the connection
exports.pool.query('SELECT NOW()')
    .then(() => {
    console.log('Successfully connected to the database');
})
    .catch(err => {
    console.error('Error connecting to the database:', err);
});
function getTableColumns(tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = $1
  `;
        try {
            const { rows } = yield exports.pool.query(query, [tableName]);
            console.log(`Found columns for table ${tableName}:`, rows.map(r => r.column_name));
            return rows.map(row => row.column_name);
        }
        catch (error) {
            console.error(`Error getting columns for table ${tableName}:`, error);
            throw error;
        }
    });
}
