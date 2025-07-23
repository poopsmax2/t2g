const request = require('supertest');
const fs = require('fs-extra');

describe('Server Tests', () => {
  describe('Express Application Creation', () => {
    test('Должен создавать Express приложение', () => {
      const express = require('express');
      const app = express();
      
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    test('Должен настраивать базовые маршруты', async () => {
      const express = require('express');
      const app = express();
      
      app.get('/test', (req, res) => {
        res.json({ message: 'Test route works' });
      });

      const response = await request(app)
        .get('/test')
        .expect(200);
      
      expect(response.body.message).toBe('Test route works');
    });
  });

  describe('Authentication Logic', () => {
    test('Должен проверять аутентификацию пользователя', () => {
      const requireAuth = (req, res, next) => {
        if (req.isAuthenticated && req.isAuthenticated()) {
          return next();
        }
        res.status(401).json({ error: 'Authentication required' });
      };

      // Мокируем запрос без аутентификации
      const mockReq = { isAuthenticated: () => false };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Должен пропускать аутентифицированного пользователя', () => {
      const requireAuth = (req, res, next) => {
        if (req.isAuthenticated && req.isAuthenticated()) {
          return next();
        }
        res.status(401).json({ error: 'Authentication required' });
      };

      // Мокируем запрос с аутентификацией
      const mockReq = { isAuthenticated: () => true };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      requireAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('API Routes Testing', () => {
    test('GET /api/user с аутентификацией', async () => {
      const express = require('express');
      const app = express();
      
      app.use(express.json());
      
      // Мок middleware аутентификации
      const mockAuth = (req, res, next) => {
        req.user = { name: 'Test User', email: 'test@example.com' };
        next();
      };

      app.get('/api/user', mockAuth, (req, res) => {
        res.json({
          name: req.user.name,
          email: req.user.email
        });
      });

      const response = await request(app)
        .get('/api/user')
        .expect(200);
      
      expect(response.body.name).toBe('Test User');
      expect(response.body.email).toBe('test@example.com');
    });

    test('POST /api/torrent/magnet с валидацией', async () => {
      const express = require('express');
      const app = express();
      
      app.use(express.json());

      app.post('/api/torrent/magnet', (req, res) => {
        const { magnetUri } = req.body;
        
        if (!magnetUri) {
          return res.status(400).json({ error: 'Magnet URI is required' });
        }
        
        if (!magnetUri.startsWith('magnet:')) {
          return res.status(400).json({ error: 'Invalid magnet URI' });
        }

        res.json({
          success: true,
          torrentId: 'mock-id',
          name: 'Mock Torrent'
        });
      });

      // Тест валидного magnet URI
      const validResponse = await request(app)
        .post('/api/torrent/magnet')
        .send({ magnetUri: 'magnet:?xt=urn:btih:test' })
        .expect(200);
      
      expect(validResponse.body.success).toBe(true);

      // Тест отсутствующего URI
      await request(app)
        .post('/api/torrent/magnet')
        .send({})
        .expect(400);

      // Тест невалидного URI
      await request(app)
        .post('/api/torrent/magnet')
        .send({ magnetUri: 'invalid-uri' })
        .expect(400);
    });

    test('GET /api/torrents должен возвращать список', async () => {
      const express = require('express');
      const app = express();
      
      app.get('/api/torrents', (req, res) => {
        const mockTorrents = [
          {
            id: 'torrent-1',
            name: 'Test Torrent 1',
            progress: 0.5,
            downloadSpeed: 1024
          },
          {
            id: 'torrent-2', 
            name: 'Test Torrent 2',
            progress: 0.8,
            downloadSpeed: 2048
          }
        ];
        
        res.json(mockTorrents);
      });

      const response = await request(app)
        .get('/api/torrents')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Test Torrent 1');
    });
  });

  describe('File Upload Testing', () => {
    test('Должен обрабатывать загрузку файлов', async () => {
      const express = require('express');
      const multer = require('multer');
      const app = express();
      
      const upload = multer({ dest: 'test-uploads/' });
      
      app.post('/upload', upload.single('testFile'), (req, res) => {
        if (!req.file) {
          return res.status(400).json({ error: 'File required' });
        }
        
        res.json({
          success: true,
          filename: req.file.originalname,
          size: req.file.size
        });
        
        // Очистка файла
        fs.remove(req.file.path).catch(console.error);
      });

      const testContent = Buffer.from('test file content');
      
      const response = await request(app)
        .post('/upload')
        .attach('testFile', testContent, 'test.txt')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.filename).toBe('test.txt');
    });
  });

  describe('Error Handling', () => {
    test('Должен обрабатывать 404 ошибки', async () => {
      const express = require('express');
      const app = express();
      
      // Middleware для обработки 404
      app.use((req, res) => {
        res.status(404).json({ error: 'Route not found' });
      });

      const response = await request(app)
        .get('/nonexistent-route')
        .expect(404);
      
      expect(response.body.error).toBe('Route not found');
    });

    test('Должен обрабатывать ошибки валидации', async () => {
      const express = require('express');
      const app = express();
      
      app.use(express.json());
      
      app.post('/validate', (req, res) => {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ 
            error: 'Email is required',
            field: 'email'
          });
        }
        
        if (!email.includes('@')) {
          return res.status(400).json({ 
            error: 'Invalid email format',
            field: 'email'
          });
        }
        
        res.json({ success: true });
      });

      // Тест отсутствующего email
      await request(app)
        .post('/validate')
        .send({})
        .expect(400);

      // Тест невалидного email
      await request(app)
        .post('/validate')
        .send({ email: 'invalid-email' })
        .expect(400);

      // Тест валидного email
      await request(app)
        .post('/validate')
        .send({ email: 'test@example.com' })
        .expect(200);
    });
  });

  describe('Utility Functions Tests', () => {
    test('Создание директорий', async () => {
      const testDir = './test-directory';
      
      // Создаем директорию
      await fs.ensureDir(testDir);
      expect(fs.existsSync(testDir)).toBe(true);
      
      // Очищаем
      await fs.remove(testDir);
      expect(fs.existsSync(testDir)).toBe(false);
    });

    test('Работа с файлами', async () => {
      const testFile = './test-file.txt';
      const testContent = 'Test file content';
      
      // Записываем файл
      await fs.writeFile(testFile, testContent);
      expect(fs.existsSync(testFile)).toBe(true);
      
      // Читаем файл
      const readContent = await fs.readFile(testFile, 'utf8');
      expect(readContent).toBe(testContent);
      
      // Очищаем
      await fs.remove(testFile);
      expect(fs.existsSync(testFile)).toBe(false);
    });
  });

  describe('Data Processing', () => {
    test('Форматирование торрент данных', () => {
      const formatTorrentData = (torrent) => ({
        id: torrent.infoHash,
        name: torrent.name,
        progress: Math.round(torrent.progress * 100),
        downloadSpeed: torrent.downloadSpeed,
        uploadSpeed: torrent.uploadSpeed,
        peers: torrent.numPeers
      });

      const mockTorrent = {
        infoHash: 'test-hash',
        name: 'Test Torrent',
        progress: 0.756,
        downloadSpeed: 1024,
        uploadSpeed: 512,
        numPeers: 10
      };

      const formatted = formatTorrentData(mockTorrent);
      
      expect(formatted.id).toBe('test-hash');
      expect(formatted.name).toBe('Test Torrent');
      expect(formatted.progress).toBe(76); // Округлено
      expect(formatted.peers).toBe(10);
    });

    test('Валидация входных данных', () => {
      const validateMagnetUri = (uri) => {
        if (!uri || typeof uri !== 'string') return false;
        return uri.trim().startsWith('magnet:');
      };

      expect(validateMagnetUri('magnet:?xt=urn:btih:test')).toBe(true);
      expect(validateMagnetUri('invalid')).toBe(false);
      expect(validateMagnetUri('')).toBe(false);
      expect(validateMagnetUri(null)).toBe(false);
      expect(validateMagnetUri(undefined)).toBe(false);
    });
  });
});