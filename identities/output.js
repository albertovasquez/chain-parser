const _ = require('lodash');
const config = require('config');
const client = require('../services/bitcoin-core');
const db = require('../services/db');
const Address = require('./address');

const createOutput = function ({
    hash,
    transactionindex,
    transactionid,
    scriptpubkeytype,
    hex,
    value
}) {
    // fields not in the db
    const fieldsToInsert = _.omit(...arguments, ['hash'])

    if (hex === undefined) {
        throw new Error('hex is required');
    }
    if (value === undefined) {
        throw new Error('value is required');
    }
    if (scriptpubkeytype === undefined) {
        throw new Error('scriptpubkeytype is required');
    }
    if (transactionid === undefined) {
        throw new Error('transactionid is required');
    }
    if (transactionindex === undefined) {
        throw new Error('transactionindex is required');
    }
    if (!hash) {
        throw new Error('hash is required');
    }

    /**
     * Return object where all sets update the database
     */
    return Object.freeze({
        addToDb: async () => {
            const address = await Address.create(hash);
            const addressid = await address.getId();

            const [outputid] = await db('output').insert({ ...fieldsToInsert, addressid });
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
            const { checksum } = await client.getDescriptorInfo({
                descriptor: `pkh(${pubkey})`
            });

            [address] = await client.deriveAddresses({
                descriptor: `pkh(${pubkey})#${checksum}`
            });
        } catch (ex) {
            console.log(ex.message, 'obtainAddressFromOutput');
            process.exit(0);
        }
    } else if (type === 'scripthash') {
        [address] = output.scriptPubKey.addresses;
    } else if (type === 'multisig') {
        [address] = output.scriptPubKey.addresses;
    } else if (type === 'pubkeyhash') {
        [address] = output.scriptPubKey.addresses;
    } else if (type === 'witness_v0_keyhash') {
        [address] = output.scriptPubKey.addresses;
    } else if (type === 'witness_v0_scripthash') {
        [address] = output.scriptPubKey.addresses;
    } else if (type === 'nulldata') {
        address = 'OP_RETURN';
    } else if (type === 'nonstandard') {
        // determine how I want to address this with the api
        address = 'Unable to decode'
    } else {
        //TODO add logger to handle address types I'm not familiar with
        console.log(output, 'unknown output scriptpubkey type');
        process.exit(0)
    }

    return address;
};

module.exports = {
    obtainAddressFromOutput,
    spend: async (id, inputId) => {
        await db('output').update({
            spentInInputId: inputId,
        }).where({ id });
    },
    create: async (output, transactionid) => {
        const scriptPubKeyTypes = config.get('scriptPubKeyTypes');
        const address = await obtainAddressFromOutput(output);

        return createOutput({
            value: output.value * config.get('BTCSATOSHI_MULTIPLIER'),
            hash: address,
            hex: output.scriptPubKey.hex,
            transactionindex: output.n,
            transactionid,
            scriptpubkeytype: scriptPubKeyTypes[output.scriptPubKey.type]
        });
    }
}