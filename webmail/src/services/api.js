// Client API wrapper for Webmail and cPanel UAPI endpoints

const API_BASE = '/api';

export const api = {
  // Config
  async getConfig() {
    const res = await fetch(`${API_BASE}/config`);
    return res.json();
  },

  async setToken(token) {
    const res = await fetch(`${API_BASE}/config/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    return res.json();
  },

  // cPanel Mailboxes UAPI
  async getMailboxes() {
    const res = await fetch(`${API_BASE}/cpanel/mailboxes`);
    return res.json();
  },

  async createMailbox({ email, password, quota, domain }) {
    const res = await fetch(`${API_BASE}/cpanel/mailboxes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, quota, domain })
    });
    return res.json();
  },

  async deleteMailbox(email) {
    const res = await fetch(`${API_BASE}/cpanel/mailboxes?email=${encodeURIComponent(email)}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async changePassword(email, newPassword) {
    const res = await fetch(`${API_BASE}/cpanel/mailboxes/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword })
    });
    return res.json();
  },

  // IMAP
  async getInbox(email, password, limit = 20) {
    const res = await fetch(`${API_BASE}/mail/inbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, limit })
    });
    return res.json();
  },

  // SMTP
  async sendMail({ from, password, to, subject, text, html }) {
    const res = await fetch(`${API_BASE}/mail/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, password, to, subject, text, html })
    });
    return res.json();
  }
};

export default api;
