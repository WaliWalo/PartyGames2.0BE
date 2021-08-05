const { getUserByUserId } = require('../controllers/userController');

const routes = (app) => {
  app.route('/users/:userId').get(getUserByUserId);
};

module.exports = routes;
