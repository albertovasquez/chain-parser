const knex = require('knex');
const config = require('config');
const dbOptions = config.get('db');
let db = null;

if (!db) {
    db = knex(dbOptions);
}

module.exports = db;