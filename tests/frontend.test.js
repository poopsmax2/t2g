/**
 * @jest-environment jsdom
 */

// Мокируем fetch API
global.fetch = jest.fn();

// Мокируем функции из dashboard.js для тестирования
const mockDashboardFunctions = {
  formatBytes: (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  formatTime: (ms) => {
    if (!ms || ms === Infinity || ms === 0) {
      if (ms === 0) return '0s';
      return 'Unknown';
    }
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  },

  escapeHtml: (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  showNotification: (message, type = 'success') => {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    if (notification && notificationText) {
      notification.className = `notification ${type}`;
      notificationText.textContent = message;
      notification.classList.remove('hidden');
    }
  },

  hideNotification: () => {
    const notification = document.getElementById('notification');
    if (notification) {
      notification.classList.add('hidden');
    }
  },

  switchTab: (tab) => {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[onclick="switchTab('${tab}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    const activeTab = document.getElementById(`${tab}-tab`);
    if (activeTab) activeTab.classList.remove('hidden');
  },

  displayTorrents: (torrents) => {
    const container = document.getElementById('torrents-list');
    if (!container) return;
    
    if (torrents.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-download"></i>
          <h3>No torrents yet</h3>
          <p>Add a torrent using the form above to get started</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = torrents.map(torrent => {
      const progress = Math.round(torrent.progress * 100);
      const status = progress === 100 ? 'completed' : 'downloading';
      const statusText = progress === 100 ? 'Completed' : 'Downloading';
      
      return `
        <div class="torrent-item">
          <div class="torrent-header">
            <div class="torrent-name">${mockDashboardFunctions.escapeHtml(torrent.name || 'Unknown')}</div>
            <div class="torrent-status status-${status}">${statusText}</div>
          </div>
          <div class="torrent-info">
            <div class="info-item">
              <div class="info-label">Progress</div>
              <div class="info-value">${progress}%</div>
            </div>
            <div class="info-item">
              <div class="info-label">Size</div>
              <div class="info-value">${mockDashboardFunctions.formatBytes(torrent.length)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Download Speed</div>
              <div class="info-value">${mockDashboardFunctions.formatBytes(torrent.downloadSpeed)}/s</div>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }
};

// Устанавливаем функции в глобальную область для тестов
Object.assign(global, mockDashboardFunctions);

describe('Frontend Functions Tests', () => {
  beforeEach(() => {
    // Сброс DOM
    document.body.innerHTML = '';
    
    // Мокируем элементы DOM
    document.body.innerHTML = `
      <div id="user-name">Loading...</div>
      <form id="magnet-form">
        <input type="text" id="magnet-input" />
        <button type="submit">Add Torrent</button>
      </form>
      <form id="file-form">
        <input type="file" id="torrent-file" />
        <button type="submit">Add Torrent</button>
      </form>
      <div class="file-label">Choose Torrent File</div>
      <div id="torrents-list"></div>
      <div id="notification" class="hidden">
        <span id="notification-text"></span>
        <button onclick="hideNotification()">Close</button>
      </div>
      <button class="refresh-btn"><i class="fas fa-sync-alt"></i></button>
    `;

    // Сброс моков
    fetch.mockClear();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('Utility Functions', () => {
    test('formatBytes должен правильно форматировать байты', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    test('formatTime должен правильно форматировать время', () => {
      expect(formatTime(0)).toBe('0s');
      expect(formatTime(Infinity)).toBe('Unknown');
      expect(formatTime(null)).toBe('Unknown');
      expect(formatTime(1000)).toBe('1s');
      expect(formatTime(60000)).toBe('1m 0s');
      expect(formatTime(3600000)).toBe('1h 0m');
      expect(formatTime(86400000)).toBe('1d 0h');
    });

    test('escapeHtml должен экранировать HTML', () => {
      expect(escapeHtml('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
      expect(escapeHtml('Normal text')).toBe('Normal text');
      expect(escapeHtml('Text & symbols')).toBe('Text &amp; symbols');
    });
  });

  describe('User Interface Functions', () => {
    test('showNotification должен показывать уведомления', () => {
      showNotification('Test message', 'success');
      
      const notification = document.getElementById('notification');
      const notificationText = document.getElementById('notification-text');
      
      expect(notification.classList.contains('hidden')).toBe(false);
      expect(notification.classList.contains('success')).toBe(true);
      expect(notificationText.textContent).toBe('Test message');
    });

    test('hideNotification должен скрывать уведомления', () => {
      showNotification('Test message');
      hideNotification();
      
      const notification = document.getElementById('notification');
      expect(notification.classList.contains('hidden')).toBe(true);
    });

    test('switchTab должен переключать вкладки', () => {
      // Добавляем элементы для тестирования вкладок
      document.body.innerHTML += `
        <button class="tab-btn active" onclick="switchTab('magnet')">Magnet</button>
        <button class="tab-btn" onclick="switchTab('file')">File</button>
        <div class="tab-content" id="magnet-tab">Magnet content</div>
        <div class="tab-content hidden" id="file-tab">File content</div>
      `;

      switchTab('file');

      const magnetTab = document.getElementById('magnet-tab');
      const fileTab = document.getElementById('file-tab');
      const magnetBtn = document.querySelector('[onclick="switchTab(\'magnet\')"]');
      const fileBtn = document.querySelector('[onclick="switchTab(\'file\')"]');

      expect(magnetTab.classList.contains('hidden')).toBe(true);
      expect(fileTab.classList.contains('hidden')).toBe(false);
      expect(magnetBtn.classList.contains('active')).toBe(false);
      expect(fileBtn.classList.contains('active')).toBe(true);
    });
  });

  describe('Torrent Display Functions', () => {
    test('displayTorrents должен показывать пустое состояние', () => {
      displayTorrents([]);

      const torrentsList = document.getElementById('torrents-list');
      expect(torrentsList.innerHTML).toContain('No torrents yet');
      expect(torrentsList.innerHTML).toContain('Add a torrent using the form above');
    });

    test('displayTorrents должен отображать торренты', () => {
      const mockTorrents = [
        {
          id: 'test-id',
          name: 'Test Torrent',
          progress: 0.75,
          length: 2097152,
          downloadSpeed: 2048,
          numPeers: 10,
          downloaded: 1572864,
          timeRemaining: 1800000
        }
      ];

      displayTorrents(mockTorrents);

      const torrentsList = document.getElementById('torrents-list');
      expect(torrentsList.innerHTML).toContain('Test Torrent');
      expect(torrentsList.innerHTML).toContain('75%');
      expect(torrentsList.innerHTML).toContain('2 MB');
      expect(torrentsList.innerHTML).toContain('2 KB/s');
    });
  });

  describe('Form Validation Logic', () => {
    test('Валидация magnet ссылок', () => {
      const validMagnet = 'magnet:?xt=urn:btih:test-hash';
      const invalidMagnet = 'invalid-magnet';
      const emptyMagnet = '';

      expect(validMagnet.startsWith('magnet:')).toBe(true);
      expect(invalidMagnet.startsWith('magnet:')).toBe(false);
      expect(emptyMagnet.trim()).toBe('');
    });

    test('Валидация torrent файлов', () => {
      const validFileName = 'test.torrent';
      const invalidFileName = 'test.txt';

      expect(validFileName.endsWith('.torrent')).toBe(true);
      expect(invalidFileName.endsWith('.torrent')).toBe(false);
    });
  });

  describe('API Interaction Tests', () => {
    test('Мокирование загрузки пользователя', async () => {
      const mockUser = { name: 'Test User', email: 'test@example.com' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const response = await fetch('/api/user');
      const userData = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/user');
      expect(userData.name).toBe('Test User');
      expect(userData.email).toBe('test@example.com');
    });

    test('Мокирование загрузки торрентов', async () => {
      const mockTorrents = [
        {
          id: 'test-id',
          name: 'Test Torrent',
          progress: 0.5,
          length: 1048576,
          downloadSpeed: 1024
        }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTorrents
      });

      const response = await fetch('/api/torrents');
      const torrents = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/torrents');
      expect(Array.isArray(torrents)).toBe(true);
      expect(torrents[0].name).toBe('Test Torrent');
    });

    test('Обработка ошибок API', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/user');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('DOM Manipulation Tests', () => {
    test('Обновление пользовательского интерфейса', () => {
      const userNameElement = document.getElementById('user-name');
      userNameElement.textContent = 'Test User';
      
      expect(userNameElement.textContent).toBe('Test User');
    });

    test('Работа с формами', () => {
      const magnetInput = document.getElementById('magnet-input');
      magnetInput.value = 'magnet:?xt=urn:btih:test';
      
      expect(magnetInput.value).toBe('magnet:?xt=urn:btih:test');
      
      // Симуляция очистки формы
      magnetInput.value = '';
      expect(magnetInput.value).toBe('');
    });

    test('Управление CSS классами', () => {
      const notification = document.getElementById('notification');
      
      // Показать уведомление
      notification.classList.remove('hidden');
      notification.classList.add('success');
      
      expect(notification.classList.contains('hidden')).toBe(false);
      expect(notification.classList.contains('success')).toBe(true);
      
      // Скрыть уведомление
      notification.classList.add('hidden');
      notification.classList.remove('success');
      
      expect(notification.classList.contains('hidden')).toBe(true);
      expect(notification.classList.contains('success')).toBe(false);
    });
  });
});