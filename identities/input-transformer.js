const { transform } = require('node-json-transform');
const moment = require('moment');
const config = require('config');
const LockingScript = require('./locking-script');
const UnLockingScript = require('./unlocking-script');

const map = {
    item: {
        utxo: {
            index: "utxo_transaction_index",
            block_height: "utxo_transaction_block_height",
            transaction_hash: "utxo_transaction_hash",
            date_time_ts: "utxo_transaction_time",
            date_time: "",
            script_type: "utxo_transaction_script_type",
            script_hex: "utxo_transaction_script_hex",
            script_hex_decoded: "",
        },
        recipient: "recipient",
        value: "value",
        transaction_hash: "transaction.hash",
        date_time_ts: "transaction.transactiontime",
        date_time: "",
        block_height: "transaction.blockid",
        signature_hex: "signatureHex",
        signature_hex_decoded: "",
        witness: "witnesses",
        sequence: "sequence",
        unlocking_stack: "",
    },
    each: async item => {
        const scriptPubKeyTypes = config.get('scriptPubKeyTypes');
        Object.values(scriptPubKeyTypes).forEach((type, index) => {
            if (item.utxo.script_type === type) {
                item.utxo.script_type = Object.keys(scriptPubKeyTypes)[index];
            }
        });

        item.utxo.date_time = moment.unix(item.utxo.date_time_ts);
        item.date_time = moment.unix(item.date_time_ts);

        const decodedLockingScript = LockingScript.create({
            hex: item.utxo.script_hex,
            type: item.utxo.script_type
        }).decodeHex();

        const decodedUnLockingScript = UnLockingScript.create({
            hex: item.signature_hex,
            type: item.utxo.script_type
        }).decodeHex();

        item.signature_hex_decoded = decodedUnLockingScript.ret.join(',');
        item.utxo.script_hex_decoded = decodedLockingScript.asm.trim();
        item.utxo.script_hex = decodedLockingScript.hex.trim();

        item.unlocking_stack = [];
        item.unlocking_stack.push(...decodedUnLockingScript.ret);
        item.unlocking_stack.push(...item.utxo.script_hex_decoded.split(" "));
    }
};

module.exports = {
    transform: data => transform(data, map)
}