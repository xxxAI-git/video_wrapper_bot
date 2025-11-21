const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

const PORT = process.env.PORT || 3000;
const tokens = {};
const TOKEN_EXPIRY = 10 * 60 * 1000; // 10 minutes
// const TOKEN_EXPIRY = 12 * 60 * 60 * 1000; // 12 hours

// Generate temporary URL
app.get('/generate', (req, res) => {
  const token = crypto.randomBytes(16).toString('hex');
  tokens[token] = Date.now() + TOKEN_EXPIRY;
  const videoUrl = req.query.video;
  const link = `${req.protocol}://${req.get('host')}/watch/${token}?video=${encodeURIComponent(videoUrl)}`;
  res.json({ url: link });
});

// Watch video
app.get('/watch/:token', (req, res) => {
  const { token } = req.params;
  const { video } = req.query;

  if (!tokens[token] || tokens[token] < Date.now()) {
    return res.status(403).send('Token expired or invalid');
  }

  res.render('video', {
    iframe_src: video,
    title: ""
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
