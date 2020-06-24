const { transformAsync } = require('node-json-transform');
const moment = require('moment');
const converter = require('hex2dec');

const map = {
    item: {
        ver: "version",
        height: "height",
        hash: "hash",
        mrkl_root: "merkleroot",
        date_time_ts: "blocktime",
        date_time: "",
        weight: "weight",
        size: "size",
        bits_hex: "bits",
        bits_dec: "",
        nonce: "nonce",
        difficulty: "difficulty",
        transactions: "transactions",
        next_block: "nextblock",
        prev_block: "previousblock",
    },
    each: item => {
        item.date_time = moment.unix(item.date_time_ts);
        item.bits_dec = Number(converter.hexToDec(item.bits_hex))
        return item;
    }
};

module.exports = {
    transform: async (data) => transformAsync(data, map)
}