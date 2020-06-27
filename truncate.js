const db = require('./services/db');

(async () => {
    await db('address').truncate();
    await db('block').truncate();
    await db('input').truncate();
    await db('output').truncate();
    await db('witness').truncate();
    await db('transaction').truncate();
    process.exit(0);
})();