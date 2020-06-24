const { transformAsync } = require('node-json-transform');

const map = {
    item: {
        value: "value",
    },
};

module.exports = {
    transform: async (data) => transformAsync(data, map)
}