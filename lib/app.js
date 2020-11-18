require('dotenv').config();
const express = require('express');
const cors = require('cors');
const request = require('superagent');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');
const { mungeTemps, mungeCities, mungeRcpData } = require('../data/munge.js');

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
    const URL = `https://app.climate.azavea.com/api/climate-data/${req.query.city_api_id}/historical/indicator/Average_High_Temperature/?years=${req.query.year_range}&time_aggregation=monthly`;
    const response = await request
      .get(URL)
      .set('Authorization', `Token ${process.env.AZAVEA_KEY}`);
      
    const newResponse = mungeTemps(JSON.parse(response.text), req.query.month_param);

    res.json(newResponse);
  } catch(e) {

    res.status(500).json({ error: e.message });
  }
});

app.get('/or_cities', async(req, res) => {
  try {
    const URL = 'https://app.climate.azavea.com/api/city/?page_size=50&admin=OR';
    const response = await request
      .get(URL)
      .set('Authorization', `Token ${process.env.AZAVEA_KEY}`);
      
    const newResponse = mungeCities(response.body);

    res.json(newResponse);
  } catch(e) {

    res.status(500).json({ error: e.message });
  }
});

app.get('/rcp45', async(req, res) => {
  try {
    const URL = `https://app.climate.azavea.com/api/climate-data/${req.query.city_api_id}/RCP45`;

    const response = await request
      .get(URL)
      .set('Authorization', `Token ${process.env.AZAVEA_KEY}`);

    const newResponse = mungeRcpData(response.body, req.query.month_param);

    res.json(newResponse);
  } catch(e) {

    res.status(500).json({ error: e.message });
  }
});

app.get('/rcp85', async(req, res) => {
  try {
    const URL = `https://app.climate.azavea.com/api/climate-data/${req.query.city_api_id}/RCP85`;
    const response = await request
      .get(URL)
      .set('Authorization', `Token ${process.env.AZAVEA_KEY}`);
      
    const newResponse = mungeRcpData(response.body, req.query.month_param);

    res.json(newResponse);
  } catch(e) {

    res.status(500).json({ error: e.message });
  }
});

app.get('/pdx_temps_since_1872', async(req, res) => {
  try {
    const data = await client.query(`
    SELECT * from temps
    `);
    res.json(data.rows);
  } catch(e) {

    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
