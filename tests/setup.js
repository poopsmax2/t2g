// Настройка для тестов
require('dotenv').config({ path: '.env.test' });

// Мокирование Google APIs
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn()
      }))
    },
    drive: jest.fn().mockImplementation(() => ({
      files: {
        create: jest.fn().mockResolvedValue({
          data: { id: 'mock-file-id' }
        })
      }
    }))
  }
}));

// Мокирование WebTorrent
jest.mock('webtorrent', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    torrents: []
  }));
});

// Мокирование Passport
jest.mock('passport', () => ({
  use: jest.fn(),
  initialize: jest.fn().mockReturnValue((req, res, next) => next()),
  session: jest.fn().mockReturnValue((req, res, next) => next()),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  authenticate: jest.fn().mockReturnValue((req, res, next) => {
    req.user = {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      accessToken: 'mock-access-token'
    };
    next();
  })
}));

// Увеличиваем timeout для тестов
jest.setTimeout(30000);

// Подавляем логи в тестах
console.log = jest.fn();
console.error = jest.fn();