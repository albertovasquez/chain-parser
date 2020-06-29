const db = require('../services/db');

// here are currently three address formats in use:

// P2PKH which begin with the number 1, eg: 1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2.
// P2SH type starting with the number 3, eg: 3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy.
// Bech32 type starting with bc1, eg: bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq.

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