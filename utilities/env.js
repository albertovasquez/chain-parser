const client = require('../services/bitcoin-core');

module.exports = {
    getStopAt: async () => {
        let stopAt = process.env.npm_config_stopat;
        if (stopAt === undefined) {
            stopAt = null;
        } else {
            stopAt = Number(process.env.npm_config_stopat);
        }

        return stopAt;
    },
    getStartBlockHeight: async (startBlockHeight) => {
        let blockHeight = process.env.npm_config_block;
        if (blockHeight === undefined) {
            try{
                blockHeight = startBlockHeight;
            } catch (ex) {
                console.log(ex.message, 'getting block height');
                process.exit(0);
            }
        } else {
            //TODO allow for zero (genesis block)
            if (process.env.npm_config_block == 0) {
                // console.log('skipping genesis block');
                process.env.npm_config_block = 1;
            }
            blockHeight = Number(process.env.npm_config_block);
        }

        return blockHeight;
    }
}