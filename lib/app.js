require('dotenv').config();
const express = require('express');
const cors = require('cors');
const request = require('superagent');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');
const { mungeTemps } = require('../data/munge.js');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // http logging

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/temps', async(req, res) => {
  try {
    const URL = 'https://app.climate.azavea.com/api/climate-data/32/historical/indicator/Average_High_Temperature/?years=2004:2005&time_aggregation=monthly';
    const response = await request
      .get(URL)
      .set('Authorization', `Token ${process.env.AZAVEA_KEY}`);

    // const newResponse = mungeTemps(response.body);

    res.json(JSON.parse(response.text));
    // res.end('hello world');
  } catch(e) {

    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
