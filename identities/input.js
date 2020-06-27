const db = require('../services/db');
const Output = require('./output');
const Witness = require('./witness');
const _ = require('lodash');

const createInput = function ({
    addressid,
    transactionid,
    spentFromOutputId,
    sequence,
    signatureHex,
    witnesses = []
}) {
    const fieldsToInsert = _.omit(...arguments, ['witnesses']);

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
    if (signatureHex === undefined) {
        throw new Error('signatureHex is required');
    }

    /**
     * Return object where all sets update the database
    */
    return Object.freeze({
        addToDb: async () => {
            // console.log(fieldsToInsert);
            const [inputid] = await db('input').insert(fieldsToInsert);
            // console.log(witnesses);
            for (const witness of witnesses) {
                if (witness === '') continue;

                try {
                    const newWitness = await Witness.create({ witness, inputid, transactionid });
                    await newWitness.addToDb();
                } catch (ex) {
                    throw ex;
                }
            }

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
    create: async ({
        txid,
        vout,
        coinbase,
        sequence,
        txinwitness = [],
        scriptSig = { hex: null } }, transactionid) => {

        let utxo = {
            id: null,
            addressId: null,
        };

        if (!coinbase) {
            try {
                utxo = await getUTXODetails(txid, vout);
                if (!utxo) {
                    // most likely because we are starting
                    // on a block later than expected - 
                    // we need to index in order
                    // console.log('could not find a utxo: creating default');
                    utxo = {
                        id: null,
                        addressId: null
                    };
                }
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
            witnesses: txinwitness,
            signatureHex: scriptSig.hex
        })
    }
}