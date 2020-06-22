const config = require('config');

(async () => {
    const addresses = config.get('addresses');
    console.log(addresses);
    console.log('debugging');
})();


//Query to get all input hashses that match this hash
/*
SELECT DISTINCT(hash) FROM input
WHERE transactionid IN
(SELECT transaction.id
FROM input
INNER JOIN transaction on transaction.id = input.transactionid
WHERE input.hash = '1Q2TWHE3GMdB6BZKafqwxXtWAWgFt5Jvm3');
*/