const db = require('../services/db');
const Output = require('./output');
const tranformer = require('./input-transformer');

const createInput = function ({
    addressid,
    transactionid,
    spentFromOutputId,
    sequence,
}) {
    if (sequence === undefined) {
        throw new Error('sequence is required');
    }
    if (spentFromOutputId === undefined) {
        throw new Error('spentFromTransactionId is required');
    }
    if (addressid === undefined) {
        throw new Error('addressid is required');
    }
    if (transactionid === undefined) {
        throw new Error('transactionid is required');
    }

    /**
     * Return object where all sets update the database
    */
    return Object.freeze({
        transform: async () => await tranformer.transform(...arguments),
        addToDb: async () => {
            const [inputid] = await db('input').insert(...arguments);

            // Set the spent in id (inputid)
            await Output.spend(spentFromOutputId, inputid);
        }
    });
}

/**
 * obtain address from previous transactions
 * if not found then use getRawTransaction
 */
const getUTXODetails = async (txid, vout) => {
    let utxoDetails = null;

    // ** FOR SPEED (used mainly with txindex is not set on node)
    // get the address from a previous transaction and index
    // retrieve old transaction to pull the utxo
    try {
        [utxoDetails] = await db.select('output.id as id', 'address.hash as addressHash', 'address.id as addressId')
            .from('address')
            .leftJoin('output', 'output.addressid', 'address.id')
            .leftJoin('transaction', 'transaction.id', 'output.transactionid')
            .where({
                'transaction.hash': txid,
                'output.transactionindex': vout,
            });
    } catch (ex) {
        console.log(ex.message, 'looking for address if from output relationship');
        process.exit(0);
    }

    return utxoDetails
}

module.exports = {
    create: async ({ txid, vout, coinbase, sequence }, transactionid) => {
        let utxo = {
            id: null,
            addressId: null,
        };

        if (!coinbase) {
            try {
                utxo = await getUTXODetails(txid, vout);
            } catch (ex) {
                console.log(ex.message, 'input create');
                process.exit(0);
            }
        }

        return createInput({
            spentFromOutputId: utxo.id,
            addressid: utxo.addressId,
            transactionid,
            sequence,
        })
    }
}