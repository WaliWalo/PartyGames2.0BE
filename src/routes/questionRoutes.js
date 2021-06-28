const { getQuestions } = require('../controllers/questionController');

const routes = (app) => {
  app.route('/questions').get(getQuestions);
};

module.exports = routes;
