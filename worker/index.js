const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port:  keys.redisPort,
    retry_strategy: () => 1000,
});
const sub = redisClient.duplicate();

function fib(index) {
    if (index <= 0) {
        return 0;
    }
    let current = 1;
    let previous = 1;
    for (let i = 2; i < index; i++) {
        const tmp = current;
        current += previous;
        previous = tmp;
    }
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(current);
        }, 10000);
    });
}

sub.on('message', async (channel, message) => {
    if (isNaN(message)) {
        console.error(`Message must be a integer, not ${message}`)
    }
    const fibValue = await fib(+message);
    redisClient.hset('indices', message, fibValue);
});
sub.subscribe('insert');
