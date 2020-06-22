const db = require('../services/db');
const Output = require('./output');

const createInput = ({
    addressId,
    transactionId,
    spentFromOutputId,
} = {}) => {
    if (spentFromOutputId === undefined) {
        throw new Error('spentFromTransactionId is required');
    }
    if (addressId === undefined) {
        throw new Error('addressId is required');
    }
    if (transactionId === undefined) {
        throw new Error('transactionid is required');
    }

    /**
     * Return object where all sets update the database
    */
    return Object.freeze({
        addToDb: async () => {
            const [inputid] = await db('input').insert({
                spentFromOutputId,
                addressid: addressId,
                transactionid: transactionId,
            });

            // Set the spent in id (inputid)
            await Output.spend( spentFromOutputId, inputid);
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
    create: async ({txid, vout }, transactionId) => {
        let utxo = null;

        try {
            utxo = await getUTXODetails(txid, vout);
        } catch (ex) {
            console.log(ex.message, 'input create');
            process.exit(0);
        }

        return createInput({
            spentFromOutputId: utxo.id,
            addressId: utxo.addressId,
            transactionId,
        })
    }
}