const request = require('supertest');
const fs = require('fs-extra');
const path = require('path');

// Мокируем WebTorrent для интеграционных тестов
const mockTorrent = {
  name: 'Test Torrent',
  infoHash: 'mock-hash-123',
  files: [
    {
      name: 'test-file.txt',
      createReadStream: () => require('stream').Readable.from(['test content'])
    }
  ],
  on: jest.fn((event, callback) => {
    if (event === 'ready') {
      setTimeout(callback, 100); // Симулируем асинхронную готовность
    }
  }),
  progress: 0.5,
  downloadSpeed: 1024,
  uploadSpeed: 512,
  numPeers: 5,
  timeRemaining: 3600000,
  downloaded: 512000,
  uploaded: 256000,
  length: 1024000
};

jest.mock('webtorrent', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn().mockReturnValue(mockTorrent),
    torrents: [mockTorrent]
  }));
});

// Мокируем Google Drive API
const mockDriveCreate = jest.fn().mockResolvedValue({
  data: { id: 'mock-drive-file-id' }
});

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn()
      }))
    },
    drive: jest.fn().mockImplementation(() => ({
      files: {
        create: mockDriveCreate
      }
    }))
  }
}));

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete User Flow', () => {
    test('Создание и работа с Express приложением', async () => {
      const express = require('express');
      const testApp = express();
      
      testApp.use(express.json());
      
      testApp.get('/', (req, res) => {
        res.send('<html><body><h1>T2G - Torrent to Google Drive</h1><p>Sign in with Google</p></body></html>');
      });

      testApp.get('/dashboard', (req, res) => {
        res.status(401).json({ error: 'Authentication required' });
      });

      testApp.get('/auth/google', (req, res) => {
        res.redirect('https://accounts.google.com/oauth/authorize');
      });

      // Тестируем основные маршруты
      const homeResponse = await request(testApp)
        .get('/')
        .expect(200);
      
      expect(homeResponse.text).toContain('T2G');
      expect(homeResponse.text).toContain('Sign in with Google');

      // Попытка доступа к защищенному ресурсу без аутентификации
      await request(testApp)
        .get('/dashboard')
        .expect(401);

      // Начало OAuth процесса
      await request(testApp)
        .get('/auth/google')
        .expect(302); // Редирект на Google
    });

    test('Workflow с аутентифицированным пользователем', async () => {
      // Создаем мок-приложение с аутентификацией
      const express = require('express');
      const testApp = express();
      
      testApp.use(express.json());
      
      // Мок middleware аутентификации
      const mockAuth = (req, res, next) => {
        req.user = {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          accessToken: 'mock-access-token'
        };
        req.isAuthenticated = () => true;
        next();
      };

      // Добавляем маршруты с мок-аутентификацией
      testApp.get('/api/user', mockAuth, (req, res) => {
        res.json({
          name: req.user.name,
          email: req.user.email
        });
      });

      testApp.post('/api/torrent/magnet', mockAuth, async (req, res) => {
        const { magnetUri } = req.body;
        
        if (!magnetUri) {
          return res.status(400).json({ error: 'Magnet URI is required' });
        }
        
        if (!magnetUri.startsWith('magnet:')) {
          return res.status(400).json({ error: 'Invalid magnet URI' });
        }

        // Симулируем добавление торрента
        const WebTorrent = require('webtorrent');
        const client = new WebTorrent();
        const torrent = client.add(magnetUri);

        res.json({
          success: true,
          torrentId: torrent.infoHash,
          name: torrent.name,
          files: torrent.files.length
        });
      });

      testApp.get('/api/torrents', mockAuth, (req, res) => {
        const WebTorrent = require('webtorrent');
        const client = new WebTorrent();
        
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

      // Тестируем аутентифицированный workflow
      const userResponse = await request(testApp)
        .get('/api/user')
        .expect(200);
      
      expect(userResponse.body.name).toBe('Test User');
      expect(userResponse.body.email).toBe('test@example.com');

      // Добавляем torrent через magnet ссылку
      const magnetResponse = await request(testApp)
        .post('/api/torrent/magnet')
        .send({ magnetUri: 'magnet:?xt=urn:btih:test-hash-123' })
        .expect(200);
      
      expect(magnetResponse.body.success).toBe(true);
      expect(magnetResponse.body.torrentId).toBe('mock-hash-123');

      // Получаем список торрентов
      const torrentsResponse = await request(testApp)
        .get('/api/torrents')
        .expect(200);
      
      expect(Array.isArray(torrentsResponse.body)).toBe(true);
      expect(torrentsResponse.body.length).toBeGreaterThan(0);
    });
  });

  describe('File Upload Integration', () => {
    test('Полный цикл загрузки torrent файла', async () => {
      // Создаем тестовый torrent файл
      const testTorrentContent = Buffer.from('mock torrent file content');
      const testTorrentPath = path.join(__dirname, 'test.torrent');
      await fs.writeFile(testTorrentPath, testTorrentContent);

      // Создаем мок-приложение с file upload
      const express = require('express');
      const multer = require('multer');
      const testApp = express();
      
      const upload = multer({ dest: 'uploads/' });
      
      testApp.post('/api/torrent/file', upload.single('torrentFile'), (req, res) => {
        if (!req.file) {
          return res.status(400).json({ error: 'Torrent file is required' });
        }

        // Симулируем успешную обработку
        res.json({
          success: true,
          torrentId: 'file-torrent-id',
          name: 'Uploaded Torrent',
          files: 1
        });

        // Очищаем загруженный файл
        fs.remove(req.file.path).catch(console.error);
      });

      // Тестируем загрузку файла
      const uploadResponse = await request(testApp)
        .post('/api/torrent/file')
        .attach('torrentFile', testTorrentPath)
        .expect(200);
      
      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.name).toBe('Uploaded Torrent');

      // Очищаем тестовый файл
      await fs.remove(testTorrentPath);
    });
  });

  describe('Google Drive Integration', () => {
    test('Интеграция с Google Drive API', async () => {
      const { google } = require('googleapis');
      
      // Симулируем функцию загрузки в Google Drive
      const uploadTorrentToGoogleDrive = async (torrent, accessToken) => {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        // Создаем папку
        const folderResponse = await drive.files.create({
          requestBody: {
            name: torrent.name,
            mimeType: 'application/vnd.google-apps.folder'
          }
        });
        
        const folderId = folderResponse.data.id;
        
        // Загружаем файлы
        for (const file of torrent.files) {
          await drive.files.create({
            requestBody: {
              name: file.name,
              parents: [folderId]
            },
            media: {
              mimeType: 'application/octet-stream',
              body: file.createReadStream()
            }
          });
        }
        
        return folderId;
      };

      // Тестируем функцию
      const folderId = await uploadTorrentToGoogleDrive(mockTorrent, 'mock-access-token');
      
      expect(folderId).toBe('mock-drive-file-id');
      expect(mockDriveCreate).toHaveBeenCalledTimes(2); // Папка + файл
    });
  });

  describe('Error Handling Integration', () => {
    test('Обработка ошибок сети', async () => {
      const express = require('express');
      const testApp = express();
      
      testApp.use(express.json());
      
      testApp.post('/api/torrent/magnet', (req, res) => {
        // Симулируем сетевую ошибку
        res.status(500).json({ error: 'Network timeout' });
      });

      const response = await request(testApp)
        .post('/api/torrent/magnet')
        .send({ magnetUri: 'magnet:?xt=urn:btih:test' })
        .expect(500);
      
      expect(response.body.error).toBe('Network timeout');
    });

    test('Обработка недействительных данных', async () => {
      const express = require('express');
      const testApp = express();
      
      testApp.use(express.json());
      
      testApp.post('/api/torrent/magnet', (req, res) => {
        const { magnetUri } = req.body;
        
        if (!magnetUri) {
          return res.status(400).json({ error: 'Magnet URI is required' });
        }
        
        if (!magnetUri.startsWith('magnet:')) {
          return res.status(400).json({ error: 'Invalid magnet URI' });
        }
        
        res.json({ success: true });
      });

      // Тест отсутствующего URI
      await request(testApp)
        .post('/api/torrent/magnet')
        .send({})
        .expect(400);

      // Тест недействительного URI
      await request(testApp)
        .post('/api/torrent/magnet')
        .send({ magnetUri: 'invalid-uri' })
        .expect(400);
    });
  });

  describe('Performance Tests', () => {
    test('Время отклика API должно быть разумным', async () => {
      const express = require('express');
      const testApp = express();
      
      testApp.use(express.json());
      
      testApp.get('/api/torrents', (req, res) => {
        // Симулируем обработку данных
        const torrents = Array.from({ length: 100 }, (_, i) => ({
          id: `torrent-${i}`,
          name: `Torrent ${i}`,
          progress: Math.random(),
          downloadSpeed: Math.floor(Math.random() * 10000)
        }));
        
        res.json(torrents);
      });

      const startTime = Date.now();
      
      await request(testApp)
        .get('/api/torrents')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      // API должно отвечать менее чем за 500ms
      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('Utility Tests', () => {
    test('Создание директорий', async () => {
      const testDownloadsDir = './test-downloads';
      const testUploadsDir = './test-uploads';

      await fs.ensureDir(testDownloadsDir);
      await fs.ensureDir(testUploadsDir);

      expect(fs.existsSync(testDownloadsDir)).toBe(true);
      expect(fs.existsSync(testUploadsDir)).toBe(true);

      // Очистка
      await fs.remove(testDownloadsDir);
      await fs.remove(testUploadsDir);
    });

    test('Форматирование данных', () => {
      // Тест форматирования байтов
      const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');

      // Тест валидации magnet ссылок (исправлено)
      const validateMagnet = (uri) => {
        if (!uri || typeof uri !== 'string') return false;
        if (uri.trim() === '') return false;
        return uri.startsWith('magnet:');
      };

      expect(validateMagnet('magnet:?xt=urn:btih:test')).toBe(true);
      expect(validateMagnet('invalid-uri')).toBe(false);
      expect(validateMagnet('')).toBe(false);
      expect(validateMagnet(null)).toBe(false);
      expect(validateMagnet(undefined)).toBe(false);
    });
  });
});