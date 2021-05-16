const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgresql client server
const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    port: keys.pgPort,
    database: keys.pgDatabase,
    password: keys.pgPassword,
});
pgClient.on('error', () => console.log('Lost PG connection'));
pgClient.query('CREATE TABLE IF NOT EXISTS fib_indices (fib_index INT)')
    .then(_ => console.log('Table fib_indices exists or has been created!'))
    .catch(err => console.log(err));

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,

    // When connection is lost, try to reconnect once every 1000 ms
    retry_strategy: () => 1000,
});

const redisPublisher = redisClient.duplicate();

// Express route handlers
app.get('/', (req, resp) => resp.send('Hi'));
app.get('/values/all', async (req, resp) => {
    try {
        const indices = await pgClient.query('SELECT * FROM fib_indices ORDER BY fib_index');
        resp.send(indices.rows);
    } catch(e) {
        console.log(e);
        resp.status(500).send('Internal server error!');
    }
});
app.get('/values/current', async (req, resp) => {
    redisClient.hgetall('indices', (err, values) => {
        if (err) {
            console.log(e);
            resp.status(500).send('Internal server error!');
            return;
        }
        resp.send(values);
    });
});
app.post('/values', async (req, resp) => {
    let index = req.body['index'];
    if (isNaN(+index)) {
        resp.status(400).send('Index is not a number!');
        return;
    }
    index = +index;
    if (index > 100) {
        resp.status(422).send('Index too high!');
        return;
    }
    try {
        redisClient.hset('indices', index, 'Fibonacci value is calculating');
        redisPublisher.publish('insert', index);
        pgClient.query('INSERT INTO fib_indices(fib_index) VALUES($1)', [index]);
        resp.send({ working: true });
    } catch(e) {
        console.log(e);
        resp.status(500).send('Internal server error!');
    }
});

app.listen(5000, () => {
    console.log('Listening...')
});
