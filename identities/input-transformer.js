const { transform } = require('node-json-transform');
const moment = require('moment');

//     type: "pubkey",
//         script_hex: "410411db93e1dcdb8a016b49840f8c53bc1eb68a382e97b1482ecad7b148a6909a5cb2e0eaddfb84ccf9744464f82e160bfa9b8b64f9d4c03f999b8643f656b412a3ac",
//             is_from_coinbase: false,
//                 is_spendable: true,
//                     is_spent: true,
//                                                     spending_sequence: 4294967295,
//                                                         spending_signature_hex: "483045022100c12a7d54972f26d14cb311339b5122f8c187417dde1e8efb6841f55c34220ae0022066632c5cd4161efa3a2837764eee9eb84975dd54c2de2865e9752585c53e7cce01",
//                                                             spending_witness: "",
//                                                                 lifespan: 48598,
//                                                                     cdd: 15.7493518518519,

const map = {
    item: {
        utxo_transaction_index: "utxo_transaction_index",
        utxo_transaction_hash: "utxo_transaction_hash",
        utxo_transaction_time_ts: "utxo_transaction_time",
        utxo_transaction_time: "",
        utxo_transaction_block_height: "utxo_transaction_block_height",
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
        item.utxo_transaction_time = moment.unix(item.utxo_transaction_time_ts);
        item.spending_date_time = moment.unix(item.spending_date_time_ts);
    }
};

module.exports = {
    transform: data => transform(data, map)
}