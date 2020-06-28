const opcodes = require('../config/opcodes');


const convertOpCodeToNames = (opCodes) => {
    return opCodes.map(code => {
        const codeInDecimal = parseInt(code, 16);
        return opcodes.find(c => c.decValue === codeInDecimal).name;
    });
}

const splitPubKeyBySize = (hex, size) => {
    const pubKey = hex.slice(0, size);
    const opCodes = hex.slice(size).toLowerCase().match(/[0-9a-f]{2}/g);

    return { pubKey, opCodes: convertOpCodeToNames(opCodes) };
}

// address pay-to-pubkey
const decodePubKeyFromHex = (hex) => {
    const decoded = {};
    decoded.hexArray = hex.toLowerCase().match(/[0-9a-f]{2}/g);
    // pubkey taken from first hexArray Value
    decoded.pubKeySize = (parseInt(decoded.hexArray[0], 16) * 2);

    // parse pub key
    const pubkeyscript = splitPubKeyBySize(decoded.hexArray.slice(1).join(''), decoded.pubKeySize);
    return `0x${pubkeyscript.pubKey} ${pubkeyscript.opCodes.join('')}`;
}

const createLockingScript = ({
    hex,
    type
}) => {
    if (hex === undefined) {
        throw new Error('hex is required');
    }
    if (type === undefined) {
        throw new Error('type is required');
    }

    return Object.freeze({
        decodeHex: () => {
            let ret = 'TODO in lockingscript';
            if (type === 'pubkey') {
                ret = decodePubKeyFromHex(hex)
            }

            return { hex, asm: ret, type }
        }
    })
};

module.exports = {
    create: ({ hex, type }) => {
        return createLockingScript({
            hex,
            type
        })
    }
}