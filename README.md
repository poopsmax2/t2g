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

#### Option A: Local Development

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

#### Option B: Docker (Recommended for Production)

**Quick Start with Script:**
```bash
# Automated setup and launch
./start-docker.sh
```

> 📖 **Подробное руководство по Docker**: [DOCKER.md](./DOCKER.md)

**Manual Setup:**
```bash
# 1. Copy environment file
cp .env.docker .env

# 2. Edit .env with your Google OAuth credentials
# GOOGLE_CLIENT_ID=your_actual_client_id
# GOOGLE_CLIENT_SECRET=your_actual_client_secret
# SESSION_SECRET=your_random_32_char_secret

# 3. Build and run with Docker Compose
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

The application will be available at `http://localhost:3000`

### 5. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
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
- **Testing**: Jest, Supertest, JSDOM

## Docker Deployment

### Docker Commands

```bash
# Build the Docker image
docker build -t t2g-app .

# Run the container
docker run -d \
  --name t2g-container \
  -p 3000:3000 \
  -e GOOGLE_CLIENT_ID="your_client_id" \
  -e GOOGLE_CLIENT_SECRET="your_client_secret" \
  -e SESSION_SECRET="your_session_secret" \
  -v $(pwd)/downloads:/app/downloads \
  -v $(pwd)/uploads:/app/uploads \
  t2g-app

# Using Docker Compose (recommended)
docker-compose up -d --build

# View logs
docker-compose logs -f t2g-app

# Stop the application
docker-compose down

# Update and restart
docker-compose down
docker-compose up -d --build
```

### Docker Environment Variables

Create a `.env` file with your configuration:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
SESSION_SECRET=your_random_session_secret_minimum_32_characters_long
PORT=3000
NODE_ENV=production
```

### Docker Features

- ✅ **Multi-stage build** for optimized image size
- ✅ **Non-root user** for enhanced security
- ✅ **Health checks** for container monitoring
- ✅ **Persistent volumes** for downloads/uploads
- ✅ **Auto-restart** policy
- ✅ **Environment variables** configuration

## Production Deployment

For production deployment:

1. **Docker (Recommended)**:
   ```bash
   # Clone repository
   git clone <repository-url>
   cd t2g
   
   # Setup environment
   cp .env.docker .env
   # Edit .env with your credentials
   
   # Deploy with Docker Compose
   docker-compose up -d --build
   ```

2. **Traditional Deployment**:
   - Set up environment variables on your hosting platform
   - Ensure HTTPS is enabled
   - Update OAuth redirect URIs in Google Cloud Console
   - Consider using a process manager like PM2

## Troubleshooting

### Common Issues

1. **OAuth Error**: Verify redirect URIs match exactly in Google Cloud Console
2. **Google Drive Upload Fails**: Check if Drive API is enabled and permissions granted
3. **Torrents Not Starting**: Ensure WebTorrent can connect to peers (firewall/NAT issues)
4. **Session Issues**: Verify SESSION_SECRET is set and consistent

### Docker Issues

1. **Container Won't Start**: Check environment variables in `.env` file
2. **Permission Denied**: Ensure downloads/uploads directories have correct permissions
3. **Port Already in Use**: Change port mapping in docker-compose.yml or stop conflicting services
4. **Build Fails**: Ensure Docker has enough disk space and memory allocated

```bash
# Check container logs
docker-compose logs t2g-app

# Check container status
docker-compose ps

# Restart container
docker-compose restart t2g-app

# Rebuild from scratch
docker-compose down
docker system prune -f
docker-compose up --build
```

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

- **39 Tests Total** with 100% pass rate ✅
- **Server Tests**: API routes, authentication, validation (15 tests)
- **Frontend Tests**: UI functions, form validation, DOM manipulation (15 tests)  
- **Integration Tests**: Complete user workflows, file uploads, Google Drive integration (9 tests)

### Test Coverage
- ✅ Google OAuth authentication flow
- ✅ Magnet link and torrent file validation
- ✅ Google Drive API integration
- ✅ Real-time torrent status updates
- ✅ Error handling and edge cases
- ✅ Security (XSS protection, input validation)
- ✅ Performance (API response times)

Run tests with:
```bash
npm test                    # Run all tests
npm run test:coverage      # Run with coverage report
```

## Disclaimer

This tool is for educational purposes. Ensure you have the right to download and distribute any content you torrent. Respect copyright laws and use responsibly.
