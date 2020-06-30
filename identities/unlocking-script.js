const decodePrivateKeyFromHex = () => {

};

const decodePublicKeyFromHex = () => {

};

const splitUnlockingScript = ({ hexArray, lengthElement }) => {
    const unlockScript = [];
    let publicKey = "";
    const privateKeySize = (parseInt(hexArray[lengthElement], 16) * 2);
    let restHex = null;

    restHex = hexArray.slice(lengthElement + 1).join('');
    const privateKey = restHex.slice(0, privateKeySize);
    unlockScript.push(privateKey);

    // is there a public key
    restHex = restHex.slice(privateKeySize);
    if (restHex !== "") {
        const publicKeyArray = restHex.toLowerCase().match(/[0-9a-f]{2}/g);
        const publicKeySize = (parseInt(publicKeyArray[0], 16) * 2);

        restHex = publicKeyArray.slice(1).join('');
        publicKey = restHex.slice(0, publicKeySize);
        unlockScript.push(publicKey);
    }

    return unlockScript;
};

const decodePubKeyHashFromHex = hex => splitUnlockingScript({
    hexArray: hex.toLowerCase().match(/[0-9a-f]{2}/g),
    lengthElement: 0
});

const decodePubKeyFromHex = hex => splitUnlockingScript({
    hexArray: hex.toLowerCase().match(/[0-9a-f]{2}/g),
    lengthElement: 0
});

const createUnLockingScript = ({
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
            let ret = 'TODO in unlockingscript';
            if (type === 'pubkey') {
                ret = decodePubKeyFromHex(hex)
            }
            if (type === 'pubkeyhash') {
                ret = decodePubKeyHashFromHex(hex)
            }
            // if (type === 'nonstandard') {
            //     // check to see how we should address this
            //     // currently going to use pubkeyhash form
            //     // but we can use previous decode types
            //     // to see which one is better fit
            //     ret = decodePubKeyHashFromHex(hex)
            // }

            return { ret }


        }
    });
}

module.exports = {
    create: ({ hex, type }) => {
        return createUnLockingScript({
            hex,
            type
        });
    }
}