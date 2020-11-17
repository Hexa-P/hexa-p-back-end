const client = require('../lib/client');
// import our seed data:
const temps = require('./temps.js');
const usersData = require('./users.js');
const { getEmoji } = require('../lib/emoji.js');

run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (email, hash)
                      VALUES ($1, $2)
                      RETURNING *;
                  `,
        [user.email, user.hash]);
      })
    );

    const user = users[0].rows[0];

    await Promise.all(
      temps.map(pdx => {
        return client.query(`
                    INSERT INTO temps (year, january, february, march, april, may, june, july, august, september, october, november, december, annual)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
                `,
        [pdx.year, pdx.january, pdx.february, pdx.march, pdx.april, pdx.may, pdx.june, pdx.july, pdx.august, pdx.september, pdx.october, pdx.november, pdx.december, pdx.annual]);
      })
    );


    console.log('seed data load complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch(err) {
    console.log(err);
  }
  finally {
    client.end();
  }

}
