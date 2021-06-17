const mongoose = require('mongoose');

const httpServer = require('./app');

const port = process.env.PORT;

mongoose
  .connect(process.env.MONGO_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(
    httpServer.listen(port, () => {
      console.log('Running on port', port);
    })
  )
  .catch((err) => console.log(err));
