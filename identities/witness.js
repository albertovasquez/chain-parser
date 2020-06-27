const _ = require('lodash');
const db = require('../services/db');

const createWitness = function ({
    witness,
    inputid,
    transactionid
}) {
    // fields not in the db
    const fieldsToInsert = _.omit(...arguments)

    if (witness === undefined) {
        throw new Error('witness is required');
    }
    if (inputid === undefined) {
        throw new Error('inputid is required');
    }
    if (transactionid === undefined) {
        throw new Error('transactionid is required');
    }

    /**
     * Return object where all sets update the database
     */
    return Object.freeze({
        addToDb: async () => await db('witness').insert(fieldsToInsert)
    });
}

module.exports = {
    create: async ({ witness, inputid, transactionid } = {}) => {
        return await createWitness({
            witness,
            inputid,
            transactionid
        })
    }
}