const { readUsers, writeUsers } = require('../config/fileDb');

exports.createUser = ({ username, password }) => {
  const users = readUsers();
  const newUser = {
    id: Date.now(),
    username,
    password,
  };
  users.push(newUser);
  writeUsers(users);
  return { id: newUser.id, username: newUser.username };
};

exports.findUserByUsername = (username) => {
  const users = readUsers();
  return users.find((u) => u.username === username);
};
