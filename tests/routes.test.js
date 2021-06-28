const app = require('../src/app');
const supertest = require('supertest');
const request = supertest(app);
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

describe('Routes tests', function () {
  beforeAll(async () => {
    jest.setTimeout(10000);
    try {
      connection = await mongoose.connect(process.env.MONGO_CONNECTION, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    } catch (error) {
      console.log(error);
    }
  });

  afterAll(async () => {
    app.close();
  });

  it('Successfully gets the room endpoint', async (done) => {
    try {
      const res = await request.get('/rooms/60c751315d4513378053af08');

      expect(res.status).toBe(200);
      done();
    } catch (error) {
      console.log(error);
    }
  });

  it('Wrong id for room endpoint', async (done) => {
    try {
      const res = await request.get('/rooms/60c751315d4513378053af03');

      expect(res.status).toBe(404);
      done();
    } catch (error) {
      console.log(error);
    }
  });

  it('Successfully gets messages by room id', async (done) => {
    try {
      const res = await request.get('/messages/60c751005d4513378053af07');

      expect(res.status).toBe(200);
      done();
    } catch (error) {
      console.log(error);
    }
  });

  it('Wrong id for messages endpoint', async (done) => {
    try {
      const res = await request.get('/messages/60c751005d4513378053af01');

      expect(res.status).toBe(404);
      done();
    } catch (error) {
      console.log(error);
    }
  });

  it('Successfully gets questions', async (done) => {
    try {
      const res = await request.get('/questions');

      expect(res.status).toBe(200);
      done();
    } catch (error) {
      console.log(error);
    }
  });
});
