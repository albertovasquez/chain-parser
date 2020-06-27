const db = require('../services/db');

const createAddress = ({
    hash,
    id,
} = {}) => {
    if (hash === undefined) {
        throw new Error('hash is required');
    }

    return Object.freeze({
        getId: async () => {
            if (id !== undefined) return id;

            // look up address to see if we already have the hash
            // if not add the address and use address.id
            const [address] = await db.select('id').from('address').where({ hash });
            if (address) {
                id = address.id;
            } else {
                [id] = await db('address').insert({ hash });
            }

            return id;
        },
    });
};

module.exports = {
    create: (hash) => {
        return createAddress({ hash });
    }
}