const opcodes = require('../config/opcodes');

const convertOpCodeToNames = (opCodes) => {
    return opCodes.map(code => {
        const codeInDecimal = parseInt(code, 16);
        return opcodes.find(c => c.decValue === codeInDecimal).name;
    });
}

const splitPubKeyBySize = ({ hexArray, lengthElement }) => {
    // which element to get length)
    const pubKeySize = (parseInt(hexArray[lengthElement], 16) * 2);
    const hex = hexArray.slice(lengthElement + 1).join('');
    const pubKey = hex.slice(0, pubKeySize);
    const endHexArray = hex.slice(pubKeySize).toLowerCase().match(/[0-9a-f]{2}/g);
    const endOpCodes = convertOpCodeToNames(endHexArray);
    let startOpCodes = [];
    if (lengthElement > 0) {
        const startHex = hexArray.slice(0, lengthElement).join('');
        const startHexArray = startHex.toLowerCase().match(/[0-9a-f]{2}/g);
        startOpCodes = convertOpCodeToNames(startHexArray);
    }

    return { pubKey, startOpCodes, endOpCodes };
}

// address pay-to-pubkey
const decodePubKeyFromHex = (hex) => {
    const pubkeyscript = splitPubKeyBySize({
        hexArray: hex.toLowerCase().match(/[0-9a-f]{2}/g),
        lengthElement: 0
    });

    return `${pubkeyscript.pubKey} ${pubkeyscript.endOpCodes.join('')}`;
}

const decodePubKeyHashFromHex = (hex) => {
    const pubkeyscript = splitPubKeyBySize({
        hexArray: hex.toLowerCase().match(/[0-9a-f]{2}/g),
        lengthElement: 2
    });

    return `${pubkeyscript.startOpCodes.join(' ')} ${pubkeyscript.pubKey} ${pubkeyscript.endOpCodes.join(' ')} `;
    return hex;
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
            if (type === 'pubkeyhash') {
                ret = decodePubKeyHashFromHex(hex)
            }
            if (type === 'nonstandard') {
                // check to see how we should address this
                // currently going to use pubkeyhash form
                // but we can use previous decode types
                // to see which one is better fit
                ret = decodePubKeyHashFromHex(hex)
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