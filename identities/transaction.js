const _ = require('lodash');
const client = require('../services/bitcoin-core');
const Output = require('./output');
const Input = require("./input");
const tranformer = require('./transaction-transformer');
const outputTranformer = require('./output-transformer');
const inputTranformer = require('./input-transformer');
const db = require('../services/db');
const spinner = require('../services/spinner');
const Boom = require('boom');

const createTransaction = function ({
    blockid,
    hash,
    blockhash,
    locktime,
    coinbase = false,
    // in bytes
    size,
    // in bytes
    vsize,
    // in bytes (est vsize * 4 though Segwit transactions have some 
    // witness data so the weight is going to be less than 4 times the vsize)
    weight,
    version,
    transactiontime,
    inputs,
    outputs,
}) {
    // fields not in the db
    const fieldsToInsert = _.omit(...arguments, ['blockhash', 'inputs', 'outputs', 'id']);

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
        transform: async () => {
            const newInputs = [];
            const newOutputs = [];

            // clean up inputs for transform
            for (const input of inputs) {
                try {
                    // coinbase we don't add input
                    if (input.addressid === null) continue;

                    // get transaction that spent this output
                    const rawTransaction = await db.select(
                        'transaction.hash as utxo_transaction_hash',
                        'transaction.transactiontime as utxo_transaction_time',
                        'transaction.blockid as utxo_transaction_block_height',
                        'output.value as value',
                        'output.transactionindex as utxo_transaction_index'
                    )
                        .from('output')
                        .leftJoin('transaction', 'output.transactionid', 'transaction.id')
                        .where('output.id', '=', input.spentFromOutputId)
                        .first();

                    const newInput = Object.assign({ ...rawTransaction }, input);
                    newInput.recipient = (await db('address').select('hash').where({ id: input.addressid }).first()).hash;
                    newInput.witnesses = (await db('witness').select('witness').where({ inputid: input.id })).map(x => x.witness);
                    newInput.transaction = _.omit(...arguments, ['inputs', 'outputs']);
                    newInputs.push(newInput);
                } catch (ex) {
                    console.log(ex, 'issue with input clean up in trx transform');
                }
            };

            // get complete output data for transform
            for (const output of outputs) {
                try {
                    // get transaction that spent this output
                    const rawTransaction = await db.select(
                        'transaction.hash as spending_transaction_hash',
                        'transaction.transactiontime as spending_date',
                        'transaction.blockid as spending_block_height',
                        'input.sequence as spending_sequence',
                        'input.signatureHex as spending_siguature_hex')
                        .from('input')
                        .leftJoin('transaction', 'input.transactionid', 'transaction.id')
                        .where('input.id', '=', output.spentInInputId)
                        .first();

                    const newOutput = Object.assign(rawTransaction || {
                        spending_transaction_hash: null,
                        spending_date: null,
                        spending_block_height: null,
                        spending_sequence: null,
                        spending_siguature_hex: null,
                    }, output);

                    newOutput.transaction = _.omit(...arguments, ['inputs', 'outputs']);
                    newOutput.recipient = (await db('address').select('hash').where({ id: output.addressid }).first()).recipient;
                    newOutput.witnesses = (await db('witness').select('witness').where({ inputid: output.spentInInputId })).map(x => x.witness);;
                    newOutputs.push(newOutput);
                } catch (ex) {
                    console.log(ex, 'issue with output clean up in trx transform');
                }
            };

            return tranformer.transform(Object.assign(...arguments, {
                inputs: inputTranformer.transform(newInputs),
                outputs: outputTranformer.transform(newOutputs)
            }));
        },
        removeFromDb: async () => {
            const [transaction] = await db.select('id').from('transaction').where({ hash });
            if (!transaction) return;

            // remove all outputs
            await db('output').where({ transactionid: transaction.id }).del();
            // remove all inputs
            await db('input').where({ transactionid: transaction.id }).del();
            // remove all inputs
            await db('witness').where({ transactionid: transaction.id }).del();

            // remove transaction
            await db('transaction').where({ hash }).del();
        },
        addToDb: async () => {
            // omit the arguments we do not want to insert into db
            const [transactionid] = await db('transaction').insert(fieldsToInsert);
            spinner.setTrx(transactionid);
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
        // return transaction with blockhash for block.hash
        const rawTransaction = await db.select('transaction.*', 'block.hash as blockhash')
            .from('transaction')
            .leftJoin('block', 'transaction.blockid', 'block.height')
            .where('transaction.hash', '=', hash)
            .first();

        if (!rawTransaction) {
            throw Boom.notFound();
        }

        rawTransaction.outputs = await db('output').where({ transactionid: rawTransaction.id });
        rawTransaction.inputs = await db('input').where({ transactionid: rawTransaction.id });
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