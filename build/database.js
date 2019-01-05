const fs = require('fs');
module.exports = function (tables) {
  this.storage = {};
  for (let id in tables) {
    const file = tables[id];
    const path = `./database/${file}.tome`;
    this.storage[file] = fs.readFileSync(path, 'utf8');
  }
}