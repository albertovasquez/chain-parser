const client = require('../services/bitcoin-core');
const Output = require('./output');
const Input = require("./input");
const db = require('../services/db');

const createTransaction = ({
    txid,
    locktime,
    size, // in bytes
    vsize, // in bytes
    weight, // in bytes (est vsize * 4 though Segwit transactions have some witness data so the weight is going to be less than 4 times the vsize)
    version,
    transactiontime,
    inputs,
    outputs,
} = {}) => {
    if (weight === undefined) {
        throw new Error('weight is required');
    }
    if (size === undefined) {
        throw new Error('size is required');
    }
    if (vsize === undefined) {
        throw new Error('vsize is required');
    }
    if (version === undefined) {
        throw new Error('version is required');
    }
    if (transactiontime === undefined) {
        throw new Error('transactiontime is required');
    }
    if (locktime === undefined) {
        throw new Error('locktime is required');
    }
    if (inputs === undefined) {
        throw new Error('inputs is required')
    }
    if (outputs === undefined) {
        throw new Error('outputs is required')
    }
    if (txid === undefined) {
        throw new Error('txid is required');
    }

    return Object.freeze({
        getTxId: () => txid,
        removeFromDb: async () => {
            const [transaction] = await db.select('id').from('transaction').where('hash', txid);
            if (!transaction) return;

            // remove all outputs
            await db('output').where({transactionid: transaction.id}).del();
            // remove all inputs
            await db('input').where({transactionid: transaction.id}).del();

            // remove transaction
            await db('transaction').where({hash: txid}).del();
        },
        addToDb: async ({
            blockid
        }) => {
            const [transactionid] = await db('transaction').insert({
                hash: txid,
                blockid,
                weight,
                transactiontime,
                vsize,
                size,
                locktime,
                version,
            });

            for (const item of outputs) {
                try  {
                    const output = await Output.create(item, transactionid);
                    await output.addToDb();
                } catch (ex) {
                    throw ex;
                }

            }

            for (const item of inputs) {
                if (item.coinbase) {
                    continue;
                }

                try {
                    const input = await Input.create(item, transactionid);
                    await input.addToDb();
                } catch (ex) {
                    throw ex;
                }

            }
        }
    });
}

module.exports = {
    createFromHash: async (hash, blockHash) => {
        let trx = null;

        try {
            trx = await client.getRawTransaction({
                txid: hash,
                verbose: true,
                blockhash: blockHash
            });
        } catch (ex) {
            throw ex;
        }

        return createTransaction({
            txid: trx.txid,
            locktime: trx.locktime,
            size: trx.size,
            weight: trx.weight,
            vsize: trx.vsize,
            version: trx.version,
            transactiontime: trx.time,
            inputs: trx.vin,
            outputs: trx.vout,
        });
    },
}