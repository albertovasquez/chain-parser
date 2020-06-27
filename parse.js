const client = require('./services/bitcoin-core');
const Block = require('./identities/block');
const envUtil = require('./utilities/env');
const spinner = require('./services/spinner');

// Command line args
//-block=<blockheight>
//-stopat=<blockheight>

// If we pass block as a param we want to start at that block
// otherwise start at latest height (and keep running)
(async () => {
    spinner.initalize();
    let startBlockHeight = await client.getBlockCount();
    let blockHeight = await envUtil.getStartBlockHeight(startBlockHeight);
    let stopAt = await envUtil.getStopAt();
    stopAt = (stopAt > blockHeight) ? stopAt : blockHeight + 1;

    // do not stop if we are starting with the latest block
    // should be continuous
    const doNotStop = (startBlockHeight === blockHeight);

    // Handler to determine if we need to retry
    // or just end the process and log for later debugging
    const ExceptionHandler = (ex) => {
        if (ex.message === 'ESOCKETTIMEDOUT') {
            spinner.text = 'Waiting on bitcoin node ...';
            setTimeout(checkIfIShouldDoWork, 5000);
            return;
        }
        console.log(ex.message, ex.stack);
        process.exit(0);
    };

    const checkIfIShouldDoWork = async () => {
        let bestHeight = null;

        try {
            bestHeight = await client.getBlockCount();
        } catch (ex) {
            return ExceptionHandler(ex);
        }

        if (blockHeight <= bestHeight) {
            // console.log(`working on block with height ${blockHeight} with latest height being ${bestHeight}`);
            spinner.setBlockText(blockHeight, bestHeight, stopAt, doNotStop);

            try {
                const block = await Block.createFromHeight(blockHeight);
                await block.removeFromDb();
                await block.parseToDb();
                blockHeight = blockHeight + 1;
            } catch (ex) {
                return ExceptionHandler(ex);
            }
        }

        if (blockHeight !== stopAt || doNotStop) {
            await checkIfIShouldDoWork();
        } else {
            process.exit(0);
        }
    };

    await checkIfIShouldDoWork();
})()