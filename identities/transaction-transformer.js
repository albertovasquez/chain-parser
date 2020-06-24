const { transformAsync } = require('node-json-transform');
const moment = require('moment');

const map = {
    item: {
        ver: "version",
        block_height: "blockid",
        hash: "hash",
        block_hash: "blockhash",
        weight: "weight",
        date_time_ts: "transactiontime",
        date_time: "",
        size: "size",
        coinbase: "coinbase",
        vsize: "vsize",
        lock_time: "locktime",
        inputs: "inputs",
        outputs: "outputs",
    },
    each: item => {
        item.date_time = moment.unix(item.date_time_ts);
        return item;
    }
};

module.exports = {
    transform: async (data) => transformAsync(data, map)
}