const client = require('../lib/client');
const { getEmoji } = require('../lib/emoji.js');

// async/await needs to run in a function
run();

async function run() {

  try {
    // initiate connecting to db
    await client.connect();

    // run a query to create tables
    await client.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(256) NOT NULL,
                    hash VARCHAR(512) NOT NULL
                );
                CREATE TABLE fav_url (
                    id SERIAL PRIMARY KEY,
                    fav_url VARCHAR(512) NOT NULL,
                    owner_id INTEGER NOT NULL REFERENCES users(id)
                );
                CREATE TABLE user_profile (
                    id SERIAL PRIMARY KEY NOT NULL,
                    city VARCHAR(512) NOT NULL,
                    month_param VARCHAR(256) NOT NULL,
                    city_api_id INTEGER NOT NULL,
                    owner_id INTEGER NOT NULL REFERENCES users(id)
                );         
                CREATE TABLE temps (
                    year INTEGER NOT NULL,
                    january FLOAT(10) NOT NULL,
                    february FLOAT(10) NOT NULL,
                    march FLOAT(10) NOT NULL,
                    april FLOAT(10) NOT NULL,
                    may FLOAT(10) NOT NULL,
                    june FLOAT(10) NOT NULL,
                    july FLOAT(10) NOT NULL,
                    august FLOAT(10) NOT NULL,
                    september FLOAT(10) NOT NULL,
                    october FLOAT(10) NOT NULL,
                    november FLOAT(10) NOT NULL,
                    december FLOAT(10) NOT NULL,
                    annual FLOAT(10) NOT NULL
                );
        `);

    console.log('create tables complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch(err) {
    // problem? let's see the error...
    console.log(err);
  }
  finally {
    // success or failure, need to close the db connection
    client.end();
  }

}
