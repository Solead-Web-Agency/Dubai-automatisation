const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const filePath = path.resolve(process.cwd(), 'assets', 'logo-dubai-immo-fond-transparent-scaled-en.avif');
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      return res.end('Not found');
    }
    res.setHeader('Content-Type', 'image/avif');
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => { res.statusCode = 500; res.end('Read error'); });
    stream.pipe(res);
  } catch (e) {
    res.statusCode = 500;
    res.end(e.message);
  }
};
