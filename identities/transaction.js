const _ = require('lodash');
const client = require('../services/bitcoin-core');
const Output = require('./output');
const Input = require("./input");
const tranformer = require('./transaction-transformer');
const db = require('../services/db');

const createTransaction = function ({
    blockid,
    hash,
    blockhash,
    locktime,
    coinbase = false,
    size, // in bytes
    vsize, // in bytes
    weight, // in bytes (est vsize * 4 though Segwit transactions have some witness data so the weight is going to be less than 4 times the vsize)
    version,
    transactiontime,
    inputs,
    outputs,
}) {
    // fields not in the db
    const fieldsToInsert = _.omit(...arguments, ['blockhash', 'inputs', 'outputs'])

    if (coinbase === undefined) {
        throw new Error('coinbase is required');
    }
    if (blockid === undefined) {
        throw new Error('blockid is required');
    }
    if (blockhash === undefined) {
        throw new Error('blockhash is required');
    }
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
    if (hash === undefined) {
        throw new Error('hash is required');
    }

    return Object.freeze({
        transform: async () => await tranformer.transform(...arguments),
        removeFromDb: async () => {
            const [transaction] = await db.select('id').from('transaction').where({ hash });
            if (!transaction) return;

            // remove all outputs
            await db('output').where({ transactionid: transaction.id }).del();
            // remove all inputs
            await db('input').where({ transactionid: transaction.id }).del();

            // remove transaction
            await db('transaction').where({ hash }).del();
        },
        addToDb: async () => {
            // omit the arguments we do not want to insert into db
            const [transactionid] = await db('transaction').insert(fieldsToInsert);

            for (const item of outputs) {
                try {
                    const output = await Output.create(item, transactionid);
                    await output.addToDb();
                } catch (ex) {
                    throw ex;
                }
            }

            for (const item of inputs) {
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
    getByHash: async hash => {
        const rawTransaction = await db('transaction').where({ hash }).first();
        const block = await db('block').where({ height: rawTransaction.blockid }).first();
        rawTransaction.outputs = await db('output').where({ transactionid: rawTransaction.id });
        rawTransaction.inputs = await db('input').where({ transactionid: rawTransaction.id });
        rawTransaction.blockhash = block.hash;
        // lets check if first transaction in block
        rawTransaction.coinbase = (rawTransaction.inputs[0].spentFromOutputId === null);

        return createTransaction(rawTransaction);
    },
    create: async ({ txHash: hash, blockHash, blockHeight }) => {
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
            hash,
            blockid: blockHeight,
            blockhash: blockHash,
            locktime: trx.locktime,
            size: trx.size,
            weight: trx.weight,
            vsize: trx.vsize,
            version: trx.version,
            transactiontime: trx.time,
            inputs: trx.vin,
            outputs: trx.vout,
            // coinbase attribute only exists in generation transactions
            // check field to see if transaction is first in the block
            coinbase: (trx.vin[0].coinbase !== undefined),
        });
    },
}