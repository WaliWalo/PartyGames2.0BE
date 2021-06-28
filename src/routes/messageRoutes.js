const { getMessages } = require('../controllers/messageController');

const routes = (app) => {
  app.route('/messages/:roomId').get(getMessages);
};

module.exports = routes;
