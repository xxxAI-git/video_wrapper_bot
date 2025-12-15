const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

const PORT = process.env.PORT || 3000;
const tokens = {};
// const TOKEN_EXPIRY = 10 * 60 * 1000; // 10 minutes
const TOKEN_EXPIRY = 6 * 60 * 60 * 1000; // 6 hours

// Middleware to parse JSON bodies (optional, for future POST support)
app.use(express.json());

// Generate temporary URL
// Expecting the video URL to be sent in the query as properly encoded
app.get('/generate', (req, res) => {
  let videoUrl = req.query.video;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing video URL' });
  }

  // Decode first in case client accidentally double-encoded
  videoUrl = decodeURIComponent(videoUrl);

  const token = crypto.randomBytes(16).toString('hex');

  // Store token with associated video and expiry
  tokens[token] = {
    expires: Date.now() + TOKEN_EXPIRY,
    video: videoUrl
  };

  // Return a clean, tokenized URL without embedding the video in the query string
  const link = `${req.protocol}://${req.get('host')}/watch/${token}`;
  res.json({ url: link });
});

// Watch video
app.get('/watch/:token', (req, res) => {
  const { token } = req.params;
  const data = tokens[token];

  if (!data || data.expires < Date.now()) {
    return res.status(403).send('Token expired or invalid');
  }

  // Optionally: delete token after first use if single-use desired
  // delete tokens[token];

  // Set referrer policy to prevent embed restrictions
  res.setHeader('Referrer-Policy', 'no-referrer');

  res.render('video', {
    iframe_src: data.video,
    title: ""
  });
});

// Cleanup expired tokens every minute to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const token in tokens) {
    if (tokens[token].expires < now) {
      delete tokens[token];
    }
  }
}, 60 * 1000);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
