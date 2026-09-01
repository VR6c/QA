const API_BASE = '/api/tasks';
const OWNER_API_BASE = '/api/owners';
const AUTH_API_BASE = '/api/auth';

function extractError(data, fallback) {
  if (!data) return fallback;
  if (typeof data.error === 'string') return data.error;
  if (data.error && typeof data.error.message === 'string') return data.error.message;
  if (typeof data.message === 'string') return data.message;
  return fallback;
}

export const api = {
  // Auth API
  async login(credentials) {
    const res = await fetch(`${AUTH_API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractError(data, 'Failed to login'));
    }
    return data;
  },

  async register(userData, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${AUTH_API_BASE}/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractError(data, 'Failed to register user'));
    }
    return data;
  },

  async getMe(token) {
    const res = await fetch(`${AUTH_API_BASE}/me`, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractError(data, 'Failed to authenticate token'));
    }
    return data;
  },

  async updateProfile(profileData, token) {
    const res = await fetch(`${AUTH_API_BASE}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractError(data, 'Failed to update profile'));
    }
    return data;
  },

  async changePassword(passwordData, token) {
    const res = await fetch(`${AUTH_API_BASE}/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(passwordData)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractError(data, 'Failed to change password'));
    }
    return data;
  },


  // Tasks API

  getAuthHeaders() {
    const token = localStorage.getItem('qa_control_center_token') || localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  async getTasks() {
    const res = await fetch(API_BASE, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to fetch tasks'));
    }
    return res.json();
  },

  async createTask(data) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to create task'));
    }
    return res.json();
  },

  async updateTask(id, data) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to update task'));
    }
    return res.json();
  },

  async startTesting(id, testerName) {
    const res = await fetch(`${API_BASE}/${id}/start-testing`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ tester_name: testerName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to start testing timer'));
    }
    return res.json();
  },

  async pauseTesting(id, nextStatus) {
    const res = await fetch(`${API_BASE}/${id}/pause-testing`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ nextStatus })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to pause testing timer'));
    }
    return res.json();
  },

  async deleteTask(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to delete task'));
    }
    return res.json();
  },

  async seedTasks() {
    const res = await fetch(`${API_BASE}/seed`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to seed sample tasks'));
    }
    return res.json();
  },

  // Owners API
  async getOwners() {
    const res = await fetch(OWNER_API_BASE);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to fetch owners'));
    }
    return res.json();
  },

  async createOwner(data) {
    const token = localStorage.getItem('qa_control_center_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(OWNER_API_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to create owner'));
    }
    return res.json();
  },

  async updateOwner(id, data) {
    const token = localStorage.getItem('qa_control_center_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${OWNER_API_BASE}/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to update owner'));
    }
    return res.json();
  },

  async deleteOwner(id) {
    const token = localStorage.getItem('qa_control_center_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${OWNER_API_BASE}/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to delete owner'));
    }
    return res.json();
  },

  // Reports API
  async getKpiTargets() {
    const res = await fetch('/api/reports/kpi-targets', { headers: this.getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to fetch KPI targets'));
    }
    return res.json();
  },

  async updateKpiTargets(data) {
    const res = await fetch('/api/reports/kpi-targets', {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to update KPI targets'));
    }
    return res.json();
  },

  async getWeeklyPreview(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const res = await fetch(`/api/reports/weekly/preview?${params.toString()}`, { headers: this.getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to fetch weekly report preview'));
    }
    return res.json();
  },

  async getMonthlyPreview(targetMonth, owner = 'all') {
    const params = new URLSearchParams({ targetMonth, owner });
    const res = await fetch(`/api/reports/monthly/preview?${params.toString()}`, { headers: this.getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to fetch monthly report preview'));
    }
    return res.json();
  },

  async finalizeReport(reportData) {
    const res = await fetch('/api/reports/finalize', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(reportData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to finalize report'));
    }
    return res.json();
  },

  async unlockTask(taskId) {
    const res = await fetch(`/api/reports/unlock-task/${taskId}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to unlock task'));
    }
    return res.json();
  },

  async getReports() {
    const res = await fetch('/api/reports', { headers: this.getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to fetch historical reports'));
    }
    return res.json();
  },

  // Chat API
  async getChatUsers() {
    const res = await fetch('/api/chat/users', { headers: this.getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to fetch chat users'));
    }
    return res.json();
  },

  async getChatMessages(params) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/chat/messages?${query}`, { headers: this.getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to fetch chat messages'));
    }
    return res.json();
  },

  async sendChatMessage(messageData) {
    const res = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(messageData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to send chat message'));
    }
    return res.json();
  },

  async deleteChatMessage(messageId) {
    const res = await fetch(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractError(err, 'Failed to delete message'));
    }
    return res.json();
  }
};
