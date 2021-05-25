const SocketMock = require('socket.io-mock');
// const { expect } = require('chai');
jest.mock('socket.io-client');
const RoomModel = require('../src/models/RoomModel');

describe('Fast and isolated socket tests', function () {
  it('Sockets should be able to talk to each other without a server', function (done) {
    let socket = new SocketMock();

    socket.on('userConnected', async (userId) => {
      try {
        expect.assertions(1);
        const rooms = await RoomModel.find({ users: userId });
        console.log(userId);
        if (rooms.length > 0) {
          socket.join(rooms[0].roomName);
        }
        console.log(socket);
      } catch (error) {
        console.log(error);
      }
      done();
      //   expect(message).to.equal('Hello World!');
    });
    socket.socketClient.emit('userConnected', '60aa6d611dab2d0015209172');
    done();
  });
});
