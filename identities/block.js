const _ = require('lodash');
const client = require('../services/bitcoin-core');
const Transaction = require('./transaction');
const tranformer = require('./block-transformer');
const db = require('../services/db');

const createBlock = async function ({
    height,
    hash,
    transactions,
    blocktime,
    version,
    nonce,
    difficulty,
    merkleroot,
    bits,
    size,
    weight
}) {
    // fields to insert into the database
    const fieldsToInsert = _.omit(...arguments, ['transactions', 'id']);
    if (weight === undefined) {
        throw new Error('weight is required');
    }
    if (size === undefined) {
        throw new Error('size is required');
    }
    if (merkleroot === undefined) {
        throw new Error('merkleroot is required');
    }
    if (bits === undefined) {
        throw new Error('bits is required');
    }
    if (height === undefined) {
        throw new Error('height is required');
    }
    if (difficulty === undefined) {
        throw new Error('difficulty is required');
    }
    if (nonce === undefined) {
        throw new Error('nonce is required');
    }
    if (version === undefined) {
        throw new Error('version is required');
    }
    if (blocktime === undefined) {
        throw new Error('blockTime is required');
    }
    if (hash === undefined) {
        throw new Error('hash is required');
    }
    if (transactions === undefined) {
        throw new Error('transactions is required');
    }

    /**
     * Gets the next or previous hash
     */
    const getPeerHash = async ({
        previous = true,
    }) => {
        let hash = null;
        const block = await db('block').where({ height: height + (previous ? -1 : 1) }).first();
        if (block) {
            hash = block.hash;
        }
        return hash;
    };

    return {
        getHash: () => hash,
        transform: async ({
            parseTx = false,
            parseNextBlock = false,
            parsePreviousBlock = false } = {}) => {

            const transformArray = await tranformer.transform(
                Object.assign(...arguments, {
                    nextblock: await getPeerHash({ previous: false }),
                    previousblock: await getPeerHash({ previous: true })
                })
            );

            return transformArray;
        },
        removeFromDb: async () => {
            // If we don't have the block return
            const block = await db('block').where({ hash }).first();
            if (!block) return;

            // remove all transactions in block
            for (const txHash of transactions) {
                try {
                    let trx = await Transaction.create({
                        txHash,
                        blockHash: hash,
                        blockHeight: height,
                    });

                    await trx.removeFromDb();
                } catch (ex) {
                    throw ex;
                }

            }

            // remove block
            await db('block').where({ hash }).del();
        },
        parseToDb: async () => {
            // remove transactions from arguments list
            await db('block').insert(fieldsToInsert);

            for (const txHash of transactions) {
                try {
                    let trx = await Transaction.create({
                        txHash,
                        blockHash: hash,
                        blockHeight: height,
                    });
                    await trx.addToDb();
                } catch (ex) {
                    throw ex;
                }
            }
        }
    }
}

module.exports = {
    getByHeight: async (height) => {
        const rawBlock = await db('block').where({ height }).first();
        const transactions = await db('transaction').where({ blockid: rawBlock.height });
        rawBlock.transactions = transactions.map(tx => tx.hash);

        return await createBlock(Object.assign({}, rawBlock));
    },
    getByHash: async (hash) => {
        const rawBlock = await db('block').where({ hash: hash }).first();
        const transactions = await db('transaction').where({ blockid: rawBlock.height });
        rawBlock.transactions = transactions.map(tx => tx.hash);

        return await createBlock(Object.assign({}, rawBlock));
    },
    createFromHeight: async (height) => {
        let hash = null;
        let rawBlock = null;

        try {
            hash = await client.getBlockHash(height);
            rawBlock = await client.getBlock(hash);
        } catch (ex) {
            throw ex;
        }

        return await createBlock({
            height,
            bits: rawBlock.bits,
            hash,
            transactions: rawBlock.tx,
            weight: rawBlock.weight,
            size: rawBlock.size,
            merkleroot: rawBlock.merkleroot,
            blocktime: rawBlock.time,
            nonce: rawBlock.nonce,
            difficulty: rawBlock.difficulty,
            version: rawBlock.difficulty,
        });
    }
}