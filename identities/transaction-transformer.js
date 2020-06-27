const { transform } = require('node-json-transform');
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
        is_coinbase: "coinbase",
        vsize: "vsize",
        lock_time: "locktime",
        fee: "",
        inputs: "inputs",
        outputs: "outputs",
    },
    each: item => {
        item.date_time = moment.unix(item.date_time_ts);
        const totalInput = item.inputs.reduce((accum, input) => {
            accum = accum + input.value;
            return accum;
        }, 0);
        const totalOutputs = item.outputs.reduce((accum, output) => {
            accum = accum + output.value;
            return accum;
        }, 0)
        item.fee = totalInput - totalOutputs;
        return item;
    }
};

module.exports = {
    transform: data => transform(data, map)
}