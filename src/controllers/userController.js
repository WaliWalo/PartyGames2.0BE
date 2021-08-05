const User = require('../models/UserModel');

const getUserByUserId = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.userId });
    if (user) {
      res.status(200).send(user);
    } else {
      let error = new Error();
      error.httpStatusCode = 404;
      error.message = 'User not found';
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserByUserId };
