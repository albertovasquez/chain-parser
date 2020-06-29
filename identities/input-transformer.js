const { transform } = require('node-json-transform');
const moment = require('moment');
const config = require('config');
const LockingScript = require('./locking-script');

const map = {
    item: {
        utxo_transaction_index: "utxo_transaction_index",
        utxo_transaction_hash: "utxo_transaction_hash",
        utxo_transaction_time_ts: "utxo_transaction_time",
        utxo_transaction_time: "",
        utxo_transaction_block_height: "utxo_transaction_block_height",
        utxo_transaction_script_type: "utxo_transaction_script_type",
        utxo_transaction_script_hex: "utxo_transaction_script_hex",
        utxo_transaction_script_asm: "",
        recipient: "recipient",
        value: "value",
        spending_transaction_hash: "transaction.hash",
        spending_date_time_ts: "transaction.transactiontime",
        spending_date_time: "",
        spending_block_height: "transaction.blockid",
        spending_signature_hex: "signatureHex",
        spending_witness: "witnesses",
        spending_sequence: "sequence",
    },
    each: async item => {
        const scriptPubKeyTypes = config.get('scriptPubKeyTypes');
        Object.values(scriptPubKeyTypes).forEach((type, index) => {
            if (item.utxo_transaction_script_type === type) {
                item.utxo_transaction_script_type = Object.keys(scriptPubKeyTypes)[index];
            }
        });

        item.utxo_transaction_time = moment.unix(item.utxo_transaction_time_ts);
        item.spending_date_time = moment.unix(item.spending_date_time_ts);

        const decodedLockingScript = LockingScript.create({
            hex: item.utxo_transaction_script_hex,
            type: item.utxo_transaction_script_type
        }).decodeHex();

        item.utxo_transaction_script_asm = decodedLockingScript.asm.trim();
        item.utxo_transaction_script_hex = decodedLockingScript.hex.trim();
    }
};

module.exports = {
    transform: data => transform(data, map)
}