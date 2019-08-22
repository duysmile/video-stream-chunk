const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const Busboy = require('busboy');
const ffmpeg = require('fluent-ffmpeg');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.htm'))
});

app.get('/upload-video', function (req, res) {
  res.sendFile(path.join(__dirname + '/upload.htm'))
});

app.post('/upload-video', async (req, res, next) => {
  try {
    const busboy = new Busboy({
      headers: req.headers
    });

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const pathVideo = path.resolve('./', `${fieldname}-${Date.now()}.avi`);
      const writeFileStream = fs.createWriteStream(pathVideo);
      file.pipe(writeFileStream).on('close', () => {
        const proc = ffmpeg(pathVideo)
          // .preset('flashvideo')
          // set video bitrate
          .videoBitrate(1024)
          // set target codec
          .videoCodec('mpeg4')
          // set aspect ratio
          .aspect('16:9')
          // set size in percent
          .size('50%')
          // set fps
          .fps(24)
          // set audio bitrate
          .audioBitrate('128k')
          // set audio codec
          .audioCodec('libmp3lame')
          // set number of audio channels
          // .audioChannels(2)
          // set custom option
          // .addOption('-vtag', 'DIVX')
          // set output format to force
          .format('mp4')
          // setup event handlers
          .on('end', function () {
            console.log('file has been converted succesfully');
            res.send('OK');
          })
          .on('error', function (err) {
            console.log('an error happened: ' + err.message);
          })
          // save to file
          .save(pathVideo.replace('avi', 'mp4'));
      });
    });

    req.pipe(busboy);
  } catch (error) {
    console.error(error);
    res.send('FAILED');
  }
});

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
  console.log('Listening on port 3000!');
});