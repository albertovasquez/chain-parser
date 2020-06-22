
const Client = require('bitcoin-core');
const options = {
    headers: false,
    network: 'mainnet',
    username: 'user',
    password: 'password',
    version: '0.20.99'
};
let client = null;


const getClient = () => {
    if (!client)  {
        client = new Client(options);
    }

    return client;
};

module.exports = getClient();

