const { transformAsync } = require('node-json-transform');

const map = {
    item: {
        sequence: "sequence",
    },
};

module.exports = {
    transform: async (data) => transformAsync(data, map)
}