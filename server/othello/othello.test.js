require('./../config/config');
var expect = require('expect');
const {ObjectID} = require('mongodb')

var {User} = require('./../models/user')
var { Othello } = require('./othello');

var seedOthelloData, newUser, newUser2;

beforeEach(() => {

  newUser = {
    userName: 'test user',
    role: 'jedi',
    socketId: '4567',
    roomId: '123',
    hash: null,
    _id: new ObjectID(),
    id: '1234567',
    __v: 0
  };

  newUser2 = {
    userName: 'test user2',
    role: 'sith',
    socketId: '12365897',
    roomId: '123',
    hash: null,
    _id: new ObjectID(),
    id: '12345678900',
    __v: 0
  };
  seedOthelloData = new Othello();
  seedOthelloData.activeUsers = [
    {
      userName: 'anon1',
      role: 'jedi',
      socketId: 'nM4WGK7Tb0WhxsaBAAAA',
      roomId: 'othellotestroom',
      hash: null,
      _id: new ObjectID(),
      id: 'P6FTUXmRDyrgJVyjAAAJ',
      __v: 0
    },
    {
      userName: 'anon2',
      role: 'sith',
      socketId: 'aA5PsHaK00dN1pwIAAAC',
      roomId: 'othellotestroom',
      hash: null,
      _id: new ObjectID(),
      id: 'plssy3-rSJtmOtA4AAAB',
      __v: 0
    },
    {
      userName: 'test user1',
      role: 'jedi',
      socketId: '1234567',
      roomId: '7890',
      hash: null,
      _id: new ObjectID(),
      id: '988753331',
      __v: 0
    }
  ];

  var allUsers = seedOthelloData.activeUsers.slice()
  allUsers.push(newUser, newUser2);
  console.log('length: ',allUsers.length);
  User.remove({}).then(()=>{
    User.insertMany(allUsers)
  }).catch(err => console.log('error setting up db'))

});


describe('test Othello', () => {


  it('should add another user', () => {
    let updatedActiveUsers = seedOthelloData.connectUser(newUser);
    expect(updatedActiveUsers.length).toBe(4);
    expect(updatedActiveUsers).toContain(newUser);
  });

  it('should not add another user', () => {
      var sameUser = seedOthelloData.activeUsers[0];
      let updatedActiveUsers = seedOthelloData.connectUser(sameUser);
      expect(updatedActiveUsers.length).toBe(3);
      expect(updatedActiveUsers).toContain(sameUser);
  });

  it('should update user socket', () => {
    // var sameUser = seedOthelloData.activeUsers[0];
    var sameUserNewSocket = seedOthelloData.activeUsers[0];
    var sameUser = Object.assign({}, sameUserNewSocket); //copy by value
    sameUserNewSocket.socketId = 'newsocketvalue';
    let updatedActiveUsers = seedOthelloData.connectUser(sameUserNewSocket);
    expect(updatedActiveUsers.length).toBe(3);
    expect(updatedActiveUsers).not.toContain(sameUser);
    expect(updatedActiveUsers).toContain(sameUserNewSocket);
  });

  it('should disconnect user', () => {
    var disconnectedUser = seedOthelloData.activeUsers[0];
    var updatedActiveUsers = seedOthelloData.disconnectUser(disconnectedUser);
    expect(updatedActiveUsers.length).toBe(2);
    expect(updatedActiveUsers).not.toContain(disconnectedUser);
  });

  it('should not disconnect user', () => {
    var fakeUser = {userName: 'fake news', socketId: '666', id: '666', role: null}
    var copyActiveUsers = seedOthelloData.activeUsers.slice();
    var updatedActiveUsers = seedOthelloData.disconnectUser(fakeUser);
    expect(updatedActiveUsers.length).toBe(3);
    expect(updatedActiveUsers).toEqual(copyActiveUsers);
  });

  it('should get active users in a room', () => {
    var roomId = 'othellotestroom';
    var usersInRoom = seedOthelloData.getActiveUsers(roomId);
    expect(usersInRoom.length).toBe(2);
    expect(usersInRoom).toContain(seedOthelloData.activeUsers[0]);
    expect(usersInRoom).toContain(seedOthelloData.activeUsers[1]);
  });

  it('should return an empty room', () => {
    var fakeRoomId = 'invalidroomid';
    var usersInRoom = seedOthelloData.getActiveUsers(fakeRoomId);
    expect(usersInRoom.length).toBe(0);
  });

  it('should add user to waiting list', () => {
    var result = seedOthelloData.addUserToWaitingList(newUser);
    // expect(result).toBe(true);
    expect(seedOthelloData.waitingList.length).toBe(1);
    expect(seedOthelloData.waitingList).toContain(newUser);
  });

  it('should add users to new game', (done) => {
    seedOthelloData.addUserToWaitingList(newUser);
    seedOthelloData.addUserToWaitingList(newUser2);
    if(seedOthelloData.waitingList.length > 1){
      seedOthelloData.addUsersToGame('testGameId').then(result=>{
        console.log('result: ', result);
        expect(result.length).toBe(2);
        // expect(result).toBeA('array');
        expect(result[0].roomId).toBe('testGameId');
        expect(result[1].roomId).toBe('testGameId');
        done();
      }).catch(err =>{
        console.log(err);
        done();
      })
    }

    // [newUser, newUser2].forEach((userToBeAdded)=>{
      // delete userToBeAdded._id;
      // var user = new User(userToBeAdded);
      // user.save().then(
        // result=>{
          // seedOthelloData.addUserToWaitingList(result)
          // if(seedOthelloData.waitingList.length > 1){
          //   seedOthelloData.addUsersToGame('testGameId').then(result=>{
          //     console.log('result: ', result);
          //     expect(result.length).toBe(2);
          //     // expect(result).toBeA('array');
          //     expect(result[0].roomId).toBe('testGameId');
          //     expect(result[1].roomId).toBe('testGameId');
          //     done();
          //   }).catch(err =>{
          //     console.log(err);
          //     done();
          //   })
          // }
      //   }
      // )
    // })
  });

  // it("should return user's current game", () => {

  // });
});
