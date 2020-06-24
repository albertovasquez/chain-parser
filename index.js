const Koa = require('koa');
const Boom = require('boom');

const app = new Koa();
const localPort = 3000;

const { routes, allowedMethods } = require('./routes');

app.use(routes())
    .use(allowedMethods({
        throw: true,
        notImplemented: Boom.notImplemented(),
        methodNotAllowed: Boom.methodNotAllowed()
    }));

app.listen(localPort, () => {
    console.log('listening on port', localPort);
})