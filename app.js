const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./route/index.route');
const corsOptions = require('./middleware/cors.Middleware');

dotenv.config();

const app = express();

app.use(express.static('public'));
app.use(cors(corsOptions));
app.use('/', routes);

module.exports = app;