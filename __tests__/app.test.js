require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('app routes', () => {
  describe('routes', () => {
    let token;
  
    beforeAll(async done => {
      execSync('npm run setup-db');
  
      client.connect();
  
      const signInData = await fakeRequest(app)
        .post('/auth/signup')
        .send({
          email: 'jon@user.com',
          password: '1234'
        });
      
      token = signInData.body.token; // eslint-disable-line
  
      return done();
    });
  
    afterAll(done => {
      return client.end(done);
    });

    test('posts and returns Jon/s user_profile', async() => {

      const sentData = [
        {
          'month_param': '01',
          'city_api_id': 32,
        },
        {
          'month_param': '12',
          'city_api_id': 32,
        }
      ];

      await fakeRequest(app)
        .post('/api/user_profile')
        .send(sentData[0])
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      await fakeRequest(app)
        .post('/api/user_profile')
        .send(sentData[1])
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      const data = await fakeRequest(app)
        .get('/api/user_profile')
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      console.log(data);
      expect(data.body).toEqual([
        {
          'id': 2,
          'month_param': 1,
          'city_api_id': 32,
          'owner_id': 2
        },
        {
          'id': 3,
          'month_param': 12,
          'city_api_id': 32,
          'owner_id': 2
        }
      ]);
    });

    test('deletes saved month/city id from /user_profile', async() => {

      const expectation =
      {
        'id': 3,
        'month_param': 12,
        'city_api_id': 32,
        'owner_id': 2
      };

      const data = await fakeRequest(app)
        .delete('/api/user_profile/3')
        .send(expectation)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual("");
    });
  });
});
