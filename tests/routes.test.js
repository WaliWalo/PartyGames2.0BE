const app = require('../src/app');
const request = require('supertest');
// const request = supertest(app);
const { MongoClient } = require('mongodb');

describe('Routes tests', function () {
  let db;
  beforeAll(async () => {
    connection = await MongoClient.connect(process.env.MONGO_CONNECTION, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = await connection.db();
  });

  afterAll(async () => {
    await db.close();
  });

  it('Gets the room endpoint', async (done) => {
    try {
      // Sends GET Request to /test endpoint
      return request(app).get('/rooms/60c751315d4513378053af08').expect(500);
      const res = await request(app)
        .get('/rooms/60c751315d4513378053af08')
        .then((response) => {
          expect(response.statusCode).toBe(500);
          done();
        });
      //   expect(res.status).toBe(500);
    } catch (error) {
      console.log(error);
    }
  });
});
