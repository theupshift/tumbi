const fs = require('fs');
module.exports = function Builder (pages) {
  this.build = () => {
    console.log('Building...');
    for (const id in pages) {
      const page = pages[id];
      const render = page.render();
      const path = `./static/${page.filename}.html`;
      fs.writeFile(path, render, (err) => {
        err && console.error(err);
      });
    }
  }
}
