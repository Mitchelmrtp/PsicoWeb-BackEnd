const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/users.json');

function readUsers() {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
}

function writeUsers(users) {
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
}

module.exports = { readUsers, writeUsers };
