const config = require('config');
const client = require('../services/bitcoin-core');
const db = require('../services/db');
const Address = require('./address');

const createOutput = ({
    hash,
    transactionIndex,
    transactionId,
    scriptPubKeyType,
    value
} = {}) => {

    if (value === undefined) {
        throw new Error('value is required');
    }

    if (scriptPubKeyType === undefined) {
        throw new Error('scriptPubKeyType is required');
    }

    if (transactionId === undefined) {
        throw new Error('transactionId is required');
    }

    if (transactionIndex === undefined) {
        throw new Error('transactionIndex is required');
    }

    if (!hash) {
        throw new Error('hash is required');
    }

    /**
     * Return object where all sets update the database
     */
    return Object.freeze({
        getHash: () => hash,
        getValue: () => value,
        getTransactionIndex: () => transactionIndex,
        setSpentInTransactionId: () => {

        },
        addToDb: async () => {
            const scriptPubKeyTypes = config.get('scriptPubKeyTypes');
            const address = await Address.create(hash);
            const addressid = await address.getId();
            const [outputid] = await db('output').insert({
                addressid,
                value,
                transactionid: transactionId,
                transactionindex: transactionIndex,
                scriptpubkeytype: scriptPubKeyTypes[scriptPubKeyType]
            });
        }
    });
}

const obtainAddressFromOutput = async (output) => {
    let address = null;
    const type = output.scriptPubKey.type;
    //Address early vouts that used public key not hash derived from the public key
    if (type === 'pubkey' && !output.scriptPubKey.addresses) {
        // https://www.reddit.com/r/Bitcoin/comments/fr1hn4/scriptpubkey_of_type_pubkey_doesnt_reference/flxqt44/
        const pubkey = output.scriptPubKey.asm.split(' ')[0];
        try {
            const {checksum} = await client.getDescriptorInfo({
                descriptor: `pkh(${pubkey})`
            });

            [address] = await client.deriveAddresses({
                descriptor: `pkh(${pubkey})#${checksum}`
            });
        } catch (ex) {
            console.log(ex.message, 'obtainAddressFromOutput');
            process.exit(0);
        }

    } else if (type==='scripthash'){
        [address] = output.scriptPubKey.addresses;
    } else if (type === 'pubkeyhash') {
        [address] = output.scriptPubKey.addresses;
    } else if (type === 'witness_v0_keyhash'){
        [address] = output.scriptPubKey.addresses;
    } else if (type === 'witness_v0_scripthash'){
        [address] = output.scriptPubKey.addresses;
    } else if (type === 'nulldata'){
        address = 'OP_RETURN';
    } else if (type === 'nonstandard') {
        // determine how I want to address this with the api
        address = 'BITSBID_REVISIT_NONSTANDARD'
    } else {
        //TODO add logger to handle address types I'm not familiar with
        console.log(output, 'unknown output scriptpubkey type');
        process.exit(0)
    }

    return address;
};

module.exports = {
    obtainAddressFromOutput,
    spend: async(id, inputId) => {
        await db('output').update({
            spentInInputId: inputId,
        }).where({id});
    },
    create: async (output, transactionId) => {
        const address = await obtainAddressFromOutput(output);
        return createOutput({
            value: output.value * config.get('BTCSATOSHI_MULTIPLIER'),
            hash: address,
            transactionIndex: output.n,
            transactionId,
            scriptPubKeyType:output.scriptPubKey.type});
    }
}