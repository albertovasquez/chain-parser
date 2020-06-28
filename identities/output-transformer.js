const { transform } = require('node-json-transform');
const moment = require('moment');
const config = require('config');
const LockingScript = require('./locking-script');

const map = {
    item: {
        index: "transactionindex",
        block_height: "transaction.blockid",
        transaction_hash: "transaction.hash",
        recipient: "recipient",
        date_time_ts: "transaction.transactiontime",
        date_time: "",
        value: "value",
        script_type: "scriptpubkeytype",
        script_hex: "hex",
        script_asm: "",
        is_spent: "",
        is_spendable: "",
        spending_transaction_hash: "spending_transaction_hash",
        spending_date_time_ts: "spending_date",
        spending_date_time: "",
        spending_block_height: "spending_block_height",
        spending_signature_hex: "spending_siguature_hex",
        spending_witness: "witnesses",
        spending_sequence: "spending_sequence",
        testing: ""
    },
    each: item => {
        // set the script pub key type
        const scriptPubKeyTypes = config.get('scriptPubKeyTypes');
        Object.values(scriptPubKeyTypes).forEach((type, index) => {
            if (item.script_type === type) {
                item.script_type = Object.keys(scriptPubKeyTypes)[index];
            }
        });

        const decodedLockingScript = LockingScript.create({
            hex: item.script_hex,
            type: item.script_type
        }).decodeHex();

        item.script_asm = decodedLockingScript.asm;
        item.script_hex = decodedLockingScript.hex;
        item.is_spent = (!item.spending_date_time_ts) ? false : true;
        item.date_time = moment.unix(item.date_time_ts);
        item.spending_date_time = (!item.spending_date_time_ts) ? null : moment.unix(item.spending_date_time_ts);
        item.is_spendable = (item.recipient === "OP_RETURN") ? false : true;
        return item;
    }
};

module.exports = {
    transform: data => transform(data, map)
}