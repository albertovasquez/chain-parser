const Router = require('koa-router');
const { Block, Transaction } = require('../identities');

const router = new Router;

router.get('/api/block/:hash', async ctx => {
    const blockHash = ctx.params.hash;
    const block = await Block.getByHash(blockHash);

    ctx.body = await block.transform();
});

router.get('/api/tx/:hash', async ctx => {
    const txHash = ctx.params.hash;
    const transaction = await Transaction.getByHash(txHash);

    ctx.body = await transaction.transform();
});

module.exports = {
    routes: router.routes.bind(router),
    allowedMethods: router.allowedMethods.bind(router)
}