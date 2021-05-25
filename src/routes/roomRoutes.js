const { getRoomByUserId } = require("../controllers/roomController");

const routes = (app) => {
  app.route("/rooms/:userId").get(getRoomByUserId);
};

module.exports = routes;
