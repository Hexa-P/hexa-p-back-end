require('dotenv').config();
const express = require('express');
const cors = require('cors');
const request = require('superagent');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');
const { mungeTemps, mungeCities, mungeRcpData, mungeArticles } = require('../data/munge.js');

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

app.get('/api/fav_url', async (req, res) => {
  try {
    const data = await client.query(`
    SELECT * from fav_url
    WHERE fav_url.owner_id = $1 
    `, [req.userId]);

    res.json(data.rows);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.post('/api/fav_url', async (req, res) => {
  try {
    const data = await client.query(`
    INSERT INTO fav_url (fav_url, owner_id)
    VALUES ($1, $2)
    RETURNING *`
      , [
        req.body.fav_url,
        req.userId
      ]);

    res.json(data.rows);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.get('/api/user_profile', async (req, res) => {
  try {
    const data = await client.query(`
    SELECT * from user_profile
    WHERE user_profile.owner_id = $1 
    `, [req.userId]);
    res.json(data.rows);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.post('/api/user_profile', async (req, res) => {
  try {
    const data = await client.query(`
    INSERT INTO user_profile (city, month_param, city_api_id, owner_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *`
      , [
        req.body.city,
        req.body.month_param,
        req.body.city_api_id,
        req.userId
      ]);

    res.json(data.rows);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/user_profile/:id', async (req, res) => {
  try {

    const userProfileId = req.params.id;

    const data = await client.query(`
    DELETE from user_profile 
    WHERE user_profile.owner_id = $1 
    `, [userProfileId]);

    res.json(data.rows[0]);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/fav_url/:id', async (req, res) => {
  try {

    const userFavId = req.params.id;

    const data = await client.query(`
    DELETE from fav_url 
    WHERE fav_url.owner_id = $1 
    `, [userFavId]);

    res.json(data.rows[0]);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.get('/temps', async (req, res) => {
  try {
    const URL = `https://app.climate.azavea.com/api/climate-data/${req.query.city_api_id}/historical/indicator/Average_High_Temperature/?years=${req.query.year_range}&time_aggregation=monthly`;
    const response = await request
      .get(URL)
      .set('Authorization', `Token ${process.env.AZAVEA_KEY}`);

    const newResponse = mungeTemps(response.body, req.query.month_param);

    res.json(newResponse);

  } catch (e) {

    if (e.status === 429) {
      res.status(500).json({
        error: `${e.message}. Retry after ${e.response.header['retry-after']}`,
        timeout: e.response.header['retry-after']
      });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

app.get('/or_cities', async (req, res) => {
  try {
    const URL = 'https://app.climate.azavea.com/api/city/?page_size=50&admin=OR';
    const response = await request
      .get(URL)
      .set('Authorization', `Token ${process.env.AZAVEA_KEY}`);

    const newResponse = mungeCities(response.body);

    res.json(newResponse);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.get('/rcp45', async (req, res) => {
  try {
    const URL = `https://app.climate.azavea.com/api/climate-data/${req.query.city_api_id}/RCP45`;

    const response = await request
      .get(URL)
      .set('Authorization', `Token ${process.env.AZAVEA_KEY}`);

    const newResponse = mungeRcpData(response.body, req.query.month_param);

    res.json(newResponse);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.get('/rcp85', async (req, res) => {
  try {
    const URL = `https://app.climate.azavea.com/api/climate-data/${req.query.city_api_id}/RCP85`;
    const response = await request
      .get(URL)
      .set('Authorization', `Token ${process.env.AZAVEA_KEY}`);

    const newResponse = mungeRcpData(response.body, req.query.month_param);

    res.json(newResponse);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.get('/pdx_temps_since_1872', async (req, res) => {
  try {
    const data = await client.query(`
    SELECT * from temps
    `);
    res.json(data.rows);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.get('/articles', async (req, res) => {
  try {
    const URL = 'https://newsapi.org/v2/everything?apiKey=a8b96774b85e4390a498d5518d97d384&q=climate';
    const response = await request
      .get(URL);

    const newResponse = mungeArticles(JSON.parse(response.text));

    res.json(newResponse);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
