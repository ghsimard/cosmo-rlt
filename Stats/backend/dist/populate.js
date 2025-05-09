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
const { pool } = require('./db');
const fs = require('fs');
const path = require('path');
function populateTestData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Read the SQL file
            const sqlFile = fs.readFileSync(path.join(__dirname, 'populate_test_data.sql'), 'utf8');
            // Execute the SQL
            yield pool.query(sqlFile);
            console.log('Successfully populated test data');
            // Query counts to verify
            const tables = ['docentes_form_submissions', 'estudiantes_form_submissions', 'acudientes_form_submissions'];
            for (const table of tables) {
                const result = yield pool.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`${table} count:`, result.rows[0].count);
            }
        }
        catch (error) {
            console.error('Error populating test data:', error);
        }
        finally {
            yield pool.end();
        }
    });
}
populateTestData();
