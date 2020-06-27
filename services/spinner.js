const ora = require('ora');
let spinner = null;
let spinnerBlockHeight = null;
let spinnerToHeight = null;
let lastTrx = null;

const initalize = () => {
    if (!spinner) {
        spinner = ora('Initializing ...').start();
    }
}

const startBlockText = () => {
    spinner.text = `Processing Trx:${lastTrx} in Block:${spinnerBlockHeight} to Block:${spinnerToHeight}`;
}

const setTrx = (trx) => {
    lastTrx = trx;
    spinner.text = `Processing Trx:${lastTrx} in Block:${spinnerBlockHeight} to Block:${spinnerToHeight}`;
}

module.exports = {
    initalize,
    spinner,
    setTrx,
    setBlockText: (blockHeight, bestHeight, stopAt, doNotStop) => {
        spinnerToHeight = bestHeight;
        spinnerBlockHeight = blockHeight;
        if (!doNotStop) {
            spinnerToHeight = stopAt - 1;
        }

        startBlockText();
    }
}