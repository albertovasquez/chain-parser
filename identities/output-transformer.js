const { transform } = require('node-json-transform');
const moment = require('moment');
const config = require('config');
const LockingScript = require('./locking-script');
const UnLockingScript = require('./unlocking-script');

const map = {
    item: {
        index: "transactionindex",
        block_height: "transaction.blockid",
        transaction_hash: "transaction.hash",
        date_time_ts: "transaction.transactiontime",
        date_time: "",
        script_type: "scriptpubkeytype",
        script_hex: "hex",
        script_hex_decoded: "",
        recipient: "recipient",
        value: "value",
        is_spendable: "",
        is_spent: "",
        spending_input: {
            transaction_hash: "spending_transaction_hash",
            date_time_ts: "spending_date",
            date_time: "",
            block_height: "spending_block_height",
            signature_hex: "spending_siguature_hex",
            signature_hex_decoded: "",
            witness: "witnesses",
            sequence: "spending_sequence",
            unlocking_stack: ""
        },
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

        item.script_hex_decoded = decodedLockingScript.asm.trim();
        item.script_hex = decodedLockingScript.hex.trim();
        item.is_spent = (!item.spending_input.date_time_ts) ? false : true;
        item.date_time = moment.unix(item.date_time_ts);
        item.is_spendable = (item.recipient === "OP_RETURN") ? false : true;

        item.spending_input.date_time = (!item.spending_input.date_time_ts) ? null : moment.unix(item.spending_input.date_time_ts);
        item.spending_input.unlocking_stack = [];
        item.spending_input.signature_hex_decoded = null;
        if (item.spending_input.signature_hex !== null) {
            const decodedUnLockingScript = UnLockingScript.create({
                hex: item.spending_input.signature_hex,
                type: item.script_type
            }).decodeHex();
            item.spending_input.signature_hex_decoded = decodedUnLockingScript.ret.join(',');
            item.spending_input.unlocking_stack.push(...decodedUnLockingScript.ret);
            item.spending_input.unlocking_stack.push(...item.script_hex_decoded.split(" "));
        }

        return item;
    }
};

module.exports = {
    transform: data => transform(data, map)
}