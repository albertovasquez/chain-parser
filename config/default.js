module.exports = {
    db: {
        client: 'mysql',
        connection: {
            host : '0.0.0.0',
            user : 'root',
            password : 'root',
            database : 'blockchain'
        }
    },
    scriptPubKeyTypes: {
        pubkey: 1,
        scripthash: 2,
        pubkeyhash: 3,
        witness_v0_keyhash: 4,
        witness_v0_scripthash: 5,
        nulldata: 6,
        nonstandard: 7,
    },
    // seed addresses of known exchanges
    seedData: {
        exchanges: [{
            Nexo: [
                "3DmvZQeddjMm1DYBznCfPZD2gicBy9h7vU",
            ],
            LCS: [
                "1M9Q77ucUCSRHacqFcm153qsL9qbi8oY8W",
            ],
            OSL: [
                "3H4dgZHGC48Fa8FTEZ7v5o1g3M7bhSGsn3",
                "3Mia6gMqPhtUDbwkLnsLe2BQwc4Bqt2VjW",
                "3EkNPcatedwnestNmPfhkDPUvafc1jSkEu"
            ],
            Kraken: [
                "3BTTDAn8HrmS2Lx48EoJy6v35B4jvAUW8p",
                "3B5t7UWMwsdLMjHqjvnnYHhXRTs1jm2Knn",
                "3KkaYrdK6MdVZfNeVEngCkPPJeTwdPi1bM"
            ]
        }],
        people: [{
            hash: "1Q2TWHE3GMdB6BZKafqwxXtWAWgFt5Jvm3",
            person: "Hal Finney"
        }, {
            hash: "12cbQLTFMXRnSzktFkuoG3eHoMeFtpTu3S",
            person: "Satoshi Nakamoto"
        }]
    },
    BTCSATOSHI_MULTIPLIER: 100000000,
}