# T2G - Torrent to Google Drive

A web application that allows you to download torrents directly to your Google Drive. Sign in with Google, upload torrent files or paste magnet links, and automatically sync downloaded content to your Google Drive.

## Features

- 🔐 **Google OAuth Authentication** - Secure sign-in with your Google account
- 📁 **Google Drive Integration** - Automatically upload downloaded files to Google Drive
- 🧲 **Magnet Link Support** - Add torrents using magnet links
- 📄 **Torrent File Upload** - Upload .torrent files directly
- 📊 **Real-time Progress Tracking** - Monitor download progress and speeds
- 🎨 **Modern UI** - Beautiful, responsive interface
- 🔄 **Auto-refresh** - Real-time updates of torrent status

## Prerequisites

- Node.js (v14 or higher)
- Google Cloud Console account for OAuth setup
- Google Drive API access

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd t2g
npm install
```

### 2. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Drive API
   - Google+ API (for authentication)

4. Create OAuth 2.0 credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
   - Copy the Client ID and Client Secret

### 3. Environment Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` file with your credentials:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
SESSION_SECRET=your_random_session_secret_here
PORT=3000
```

### 4. Run the Application

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

### 5. Run Tests

```bash
# Run all tests
npm test
```

## Usage

1. **Sign In**: Click "Sign in with Google" on the homepage
2. **Authorize**: Grant permission for Google Drive access
3. **Add Torrents**: 
   - Use the "Magnet Link" tab to paste magnet URLs
   - Use the "Torrent File" tab to upload .torrent files
4. **Monitor**: Watch real-time progress in the dashboard
5. **Check Google Drive**: Downloaded files will appear in a folder named after the torrent

## Project Structure

```
t2g/
├── server.js           # Main server file
├── package.json        # Dependencies and scripts
├── .env.example        # Environment variables template
├── public/             # Frontend files
│   ├── index.html      # Landing page
│   ├── dashboard.html  # Dashboard for authenticated users
│   ├── styles.css      # CSS styles
│   └── dashboard.js    # Frontend JavaScript
├── downloads/          # Temporary torrent downloads (auto-created)
└── uploads/            # Temporary torrent file uploads (auto-created)
```

## API Endpoints

- `GET /` - Landing page
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/logout` - Logout
- `GET /dashboard` - Dashboard (authenticated)
- `GET /api/user` - Get user info
- `POST /api/torrent/magnet` - Add torrent by magnet link
- `POST /api/torrent/file` - Add torrent by file upload
- `GET /api/torrents` - Get all active torrents

## Security Notes

- All API endpoints except landing page require authentication
- Google Drive access is limited to file creation only
- Session secrets should be cryptographically secure
- HTTPS recommended for production deployment

## Technologies Used

- **Backend**: Node.js, Express, Passport.js
- **Authentication**: Google OAuth 2.0
- **Torrent Handling**: WebTorrent
- **Google APIs**: Google Drive API v3
- **Frontend**: Vanilla JavaScript, CSS3, Font Awesome
- **File Upload**: Multer
- **Testing**: Jest, Supertest

## Deployment

For production deployment:

1. Set up environment variables on your hosting platform
2. Ensure HTTPS is enabled  
3. Update OAuth redirect URIs in Google Cloud Console
4. Consider using a process manager like PM2

## Troubleshooting

### Common Issues

1. **OAuth Error**: Verify redirect URIs match exactly in Google Cloud Console
2. **Google Drive Upload Fails**: Check if Drive API is enabled and permissions granted
3. **Torrents Not Starting**: Ensure WebTorrent can connect to peers (firewall/NAT issues)
4. **Session Issues**: Verify SESSION_SECRET is set and consistent

### Development Tips

- Use `npm run dev` for development with auto-restart
- Check browser console for frontend errors
- Monitor server logs for backend issues
- Test with popular public torrents first

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Testing

The application includes comprehensive tests covering:

- **Server Tests**: API routes, authentication, validation
- **Frontend Tests**: UI functions, form validation, DOM manipulation  
- **Integration Tests**: Complete user workflows, file uploads, Google Drive integration

### Test Coverage
- ✅ Google OAuth authentication flow
- ✅ Magnet link and torrent file validation
- ✅ Google Drive API integration
- ✅ Real-time torrent status updates
- ✅ Error handling and edge cases

Run tests with:
```bash
npm test
```

## Disclaimer

This tool is for educational purposes. Ensure you have the right to download and distribute any content you torrent. Respect copyright laws and use responsibly.
