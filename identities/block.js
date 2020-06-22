const client = require('../services/bitcoin-core');
const Transaction = require('./transaction');
const db = require('../services/db');

const createBlock = ({
    height = null,
    blockHash = null,
    rawBlock=null,
    blockTime = null,
} = {}) => {
    if (height === null || height === undefined) {
        throw new Error('height is required');
    }

    if (!blockTime) {
        throw new Error('blockTime is required');
    }

    if (!blockHash) {
        throw new Error('hash is required');
    }

    if (!rawBlock) {
        throw new Error('block is required');
    }

    return {
        getHeight: () => height,
        removeFromDb: async () => {
            // If we don't have the block return
            const block = await db('block').where({hash: blockHash})
            if (!block.length) return;

            // remove all transactions in block
            for (const hash of rawBlock.tx) {
                try {
                    let trx = await Transaction.createFromHash(hash, blockHash);
                    await trx.removeFromDb();
                } catch (ex) {
                    throw ex;
                }

            }

            // remove block
            await db('block').where({hash: blockHash}).del();
        },
        parseToDb: async () => {
            const [blockid] = await db('block').insert({hash: blockHash, blocktime: blockTime});

            for (const hash of rawBlock.tx) {
                try {
                    let trx = await Transaction.createFromHash(hash, blockHash);
                    await trx.addToDb({ blockid });
                } catch (ex) {
                    throw ex;
                }
            }
        }
    }
}

module.exports = {
    createFromHeight: async (height) => {
        let hash = null;
        let rawBlock = null;

        try {
            hash = await client.getBlockHash(height);
            rawBlock = await client.getBlock(hash);
        } catch (ex) {
            throw ex;
        }

        return createBlock({height, blockHash: hash, rawBlock, blockTime: rawBlock.time});
    },
}