const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { google } = require('googleapis');
const WebTorrent = require('webtorrent');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// File upload configuration
const upload = multer({ dest: 'uploads/' });

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  // Store user data in session
  const user = {
    id: profile.id,
    name: profile.displayName,
    email: profile.emails[0].value,
    accessToken: accessToken,
    refreshToken: refreshToken
  };
  return done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// WebTorrent client
const client = new WebTorrent();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Google OAuth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// Dashboard route
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API routes
app.get('/api/user', requireAuth, (req, res) => {
  res.json({
    name: req.user.name,
    email: req.user.email
  });
});

// Add torrent by magnet link
app.post('/api/torrent/magnet', requireAuth, async (req, res) => {
  try {
    const { magnetUri } = req.body;
    if (!magnetUri) {
      return res.status(400).json({ error: 'Magnet URI is required' });
    }

    console.log('Adding magnet:', magnetUri);
    
    const torrent = client.add(magnetUri, { path: './downloads' });
    
    torrent.on('ready', () => {
      console.log('Torrent ready:', torrent.name);
      res.json({
        success: true,
        torrentId: torrent.infoHash,
        name: torrent.name,
        files: torrent.files.length
      });
      
      // Start uploading to Google Drive when ready
      uploadTorrentToGoogleDrive(torrent, req.user.accessToken);
    });

    torrent.on('error', (err) => {
      console.error('Torrent error:', err);
      res.status(500).json({ error: err.message });
    });

  } catch (error) {
    console.error('Error adding magnet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add torrent by file upload
app.post('/api/torrent/file', requireAuth, upload.single('torrentFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Torrent file is required' });
    }

    console.log('Adding torrent file:', req.file.originalname);
    
    const torrent = client.add(req.file.path, { path: './downloads' });
    
    torrent.on('ready', () => {
      console.log('Torrent ready:', torrent.name);
      res.json({
        success: true,
        torrentId: torrent.infoHash,
        name: torrent.name,
        files: torrent.files.length
      });
      
      // Clean up uploaded torrent file
      fs.remove(req.file.path);
      
      // Start uploading to Google Drive when ready
      uploadTorrentToGoogleDrive(torrent, req.user.accessToken);
    });

    torrent.on('error', (err) => {
      console.error('Torrent error:', err);
      res.status(500).json({ error: err.message });
      // Clean up uploaded torrent file
      fs.remove(req.file.path);
    });

  } catch (error) {
    console.error('Error adding torrent file:', error);
    res.status(500).json({ error: error.message });
    if (req.file) {
      fs.remove(req.file.path);
    }
  }
});

// Get torrent status
app.get('/api/torrents', requireAuth, (req, res) => {
  const torrents = client.torrents.map(torrent => ({
    id: torrent.infoHash,
    name: torrent.name,
    progress: torrent.progress,
    downloadSpeed: torrent.downloadSpeed,
    uploadSpeed: torrent.uploadSpeed,
    numPeers: torrent.numPeers,
    timeRemaining: torrent.timeRemaining,
    downloaded: torrent.downloaded,
    uploaded: torrent.uploaded,
    length: torrent.length
  }));
  
  res.json(torrents);
});

// Function to upload torrent files to Google Drive
async function uploadTorrentToGoogleDrive(torrent, accessToken) {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Create a folder for this torrent
    const folderResponse = await drive.files.create({
      requestBody: {
        name: torrent.name,
        mimeType: 'application/vnd.google-apps.folder'
      }
    });
    
    const folderId = folderResponse.data.id;
    console.log(`Created folder ${torrent.name} with ID: ${folderId}`);
    
    // Upload each file in the torrent
    for (const file of torrent.files) {
      console.log(`Uploading file: ${file.name}`);
      
      const fileMetadata = {
        name: file.name,
        parents: [folderId]
      };
      
      const media = {
        mimeType: 'application/octet-stream',
        body: file.createReadStream()
      };
      
      try {
        const uploadResponse = await drive.files.create({
          requestBody: fileMetadata,
          media: media
        });
        
        console.log(`Uploaded ${file.name} with ID: ${uploadResponse.data.id}`);
      } catch (uploadError) {
        console.error(`Error uploading ${file.name}:`, uploadError);
      }
    }
    
    console.log(`All files from ${torrent.name} uploaded to Google Drive`);
    
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
  }
}

// Ensure directories exist
fs.ensureDirSync('./downloads');
fs.ensureDirSync('./uploads');

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});