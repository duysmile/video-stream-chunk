const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.htm'))
})

app.get('/video', (req, res, next) => {
  const path = 'assets/sample.mp4';
  const stat = fs.statSync(path);
  const fileSize = stat.size;
  const range = req.headers.range;
  if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(path, { start, end });
      const headers = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'video/mp4'
      };

      res.writeHead(206, headers);
      file.pipe(res);
  } else {
      const headers = {
          'Content-Type': 'video/mp4',
          'Content-Length': fileSize
      };

      res.write(200, headers);
      fs.createReadStream(path).pipe(res);
  }
});

app.listen(3000, function () {
  console.log('Listening on port 3000!')
})