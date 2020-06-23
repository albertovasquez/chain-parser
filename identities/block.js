const client = require('../services/bitcoin-core');
const Transaction = require('./transaction');
const db = require('../services/db');
const converter = require('hex2dec');

const createBlock = ({
    height,
    blockHash,
    rawBlock,
    blockTime,
    version,
    nonce,
    difficulty,
    merkleroot,
    bits,
    size,
    weight
} = {}) => {
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
    if (blockTime === undefined) {
        throw new Error('blockTime is required');
    }
    if (blockHash === undefined) {
        throw new Error('hash is required');
    }
    if (rawBlock === undefined) {
        throw new Error('block is required');
    }

    return {
        getHeight: () => height,
        removeFromDb: async () => {
            // If we don't have the block return
            const block = await db('block').where({ hash: blockHash })
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
            await db('block').where({ hash: blockHash }).del();
        },
        parseToDb: async () => {
            const [blockid] = await db('block').insert({
                height,
                hash: blockHash,
                blocktime: blockTime,
                nonce,
                bits,
                difficulty,
                version,
                merkleroot,
                weight,
                size,
            });

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
            // console.log(rawBlock);
            // converter.hexToDec(rawBlock.bits)
        } catch (ex) {
            throw ex;
        }

        return createBlock({
            height,
            bits: rawBlock.bits,
            blockHash: hash,
            rawBlock,
            weight: rawBlock.weight,
            size: rawBlock.size,
            merkleroot: rawBlock.merkleroot,
            blockTime: rawBlock.time,
            nonce: rawBlock.nonce,
            difficulty: rawBlock.difficulty,
            version: rawBlock.difficulty,
        });
    },
}