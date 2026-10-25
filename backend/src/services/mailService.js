import https from 'https';
import tls from 'tls';

/**
 * =========================================================================
 * 1. CPANEL UAPI SERVICE
 * =========================================================================
 */
export class CPanelMailService {
  constructor() {
    this.host = process.env.CPANEL_HOST || 'nckh.anhvoli.id.vn';
    this.port = process.env.CPANEL_PORT || 2083;
    this.user = process.env.CPANEL_USER || 'eh8vxynb05pr';
    this.token = process.env.CPANEL_TOKEN || '';
    this.domain = process.env.MAIL_DOMAIN || 'nckh.anhvoli.id.vn';
  }

  async request(endpoint, method = 'GET', data = null) {
    const token = this.token || process.env.CPANEL_TOKEN;
    if (!token || token === 'YOUR_CPANEL_API_TOKEN_HERE') {
      throw new Error('Chưa cấu hình CPANEL_TOKEN trong .env. Vui lòng lấy token tại cPanel > Manage API Tokens.');
    }

    const authHeader = `cpanel ${this.user}:${token.trim()}`;
    let url = `https://${this.host}:${this.port}/execute/${endpoint}`;
    let bodyData = null;

    if (method === 'GET' && data) {
      const params = new URLSearchParams(data).toString();
      url += `?${params}`;
    } else if (method === 'POST' && data) {
      bodyData = new URLSearchParams(data).toString();
    }

    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || this.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        rejectUnauthorized: false,
        headers: {
          'Authorization': authHeader,
          'User-Agent': 'NodeJS-cPanel-API-Client/1.0',
        }
      };

      if (bodyData) {
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.headers['Content-Length'] = Buffer.byteLength(bodyData);
      }

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(responseBody);
            if (json.status === 0) {
              const errMsg = Array.isArray(json.errors) ? json.errors.join('; ') : 'Yêu cầu UAPI thất bại';
              return reject(new Error(errMsg));
            }
            resolve(json);
          } catch (err) {
            if (responseBody.includes('login') || res.statusCode === 401) {
              return reject(new Error('Lỗi xác thực 401: Token hoặc tài khoản cPanel không chính xác.'));
            }
            reject(new Error(`cPanel phản hồi lỗi (${res.statusCode}): ${responseBody.slice(0, 200)}`));
          }
        });
      });

      req.on('error', (err) => reject(new Error(`Không thể kết nối cPanel UAPI: ${err.message}`)));
      req.setTimeout(25000, () => {
        req.destroy();
        reject(new Error('Hết thời gian chờ kết nối cPanel (Timeout 25s)'));
      });

      if (bodyData) {
        req.write(bodyData);
      }
      req.end();
    });
  }

  // Liệt kê danh sách hộp thư
  async listMailboxes() {
    const res = await this.request('Email/list_pops');
    return res.data || [];
  }

  // Tạo hộp thư mới
  async createMailbox({ email, password, quota = 1024, domain = null }) {
    let cleanEmail = email.trim();
    if (cleanEmail.includes('@')) {
      cleanEmail = cleanEmail.split('@')[0];
    }

    if (!cleanEmail) {
      throw new Error('Tên hộp mail (email) không được để trống.');
    }

    const targetDomain = domain || this.domain;
    const finalPassword = password || generateStrongPass();

    const payload = {
      email: cleanEmail,
      domain: targetDomain,
      password: finalPassword,
      quota: quota || 1024
    };

    const res = await this.request('Email/add_pop', 'POST', payload);
    return {
      success: true,
      email: `${cleanEmail}@${targetDomain}`,
      password: finalPassword,
      quota: payload.quota,
      message: `Đã tạo thành công hộp thư ${cleanEmail}@${targetDomain}`,
      raw: res
    };
  }

  // Xóa hộp thư
  async deleteMailbox(fullEmail) {
    const cleanEmail = fullEmail.trim();
    const res = await this.request(`Email/delete_pop?email=${encodeURIComponent(cleanEmail)}`, 'GET');
    return {
      success: true,
      message: `Đã xóa hộp thư ${cleanEmail}`,
      raw: res
    };
  }

  // Đổi mật khẩu
  async changePassword(fullEmail, newPassword) {
    const payload = {
      email: fullEmail.trim(),
      password: newPassword
    };
    const res = await this.request('Email/passwd_pop', 'POST', payload);
    return {
      success: true,
      message: `Đã đổi mật khẩu cho hộp thư ${fullEmail}`,
      raw: res
    };
  }
}

/**
 * =========================================================================
 * 2. IMAP PARSER & CLIENT SERVICE (Port 993 SSL)
 * =========================================================================
 */
export function decodeMimeHeader(headerStr = '') {
  if (!headerStr) return '';
  return headerStr.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (match, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        return Buffer.from(text, 'base64').toString(charset.toLowerCase() === 'utf-8' ? 'utf8' : 'latin1');
      } else if (encoding.toUpperCase() === 'Q') {
        const decoded = text
          .replace(/_/g, ' ')
          .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        return Buffer.from(decoded, 'binary').toString('utf8');
      }
    } catch (e) {
      return text;
    }
    return match;
  });
}

export function decodeQuotedPrintable(str = '') {
  return str
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export function parseRawEmail(raw = '') {
  const parts = raw.split(/\r?\n\r?\n/);
  const headerBlock = parts[0] || '';
  const bodyBlock = parts.slice(1).join('\n\n') || '';

  const headers = {};
  const headerLines = headerBlock.split(/\r?\n(?![ \t])/);
  for (const line of headerLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const val = line.slice(colonIdx + 1).trim();
      headers[key] = decodeMimeHeader(val);
    }
  }

  const contentType = headers['content-type'] || 'text/plain';
  let bodyText = '';
  let bodyHtml = '';

  const boundaryMatch = contentType.match(/boundary=["']?([^"';]+)["']?/i);
  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const subParts = bodyBlock.split(new RegExp(`--${boundary}(?:--)?`));

    for (const sub of subParts) {
      if (!sub.trim()) continue;
      const subSplit = sub.split(/\r?\n\r?\n/);
      const subHeader = subSplit[0] || '';
      const subBody = subSplit.slice(1).join('\n\n') || '';

      const isHtml = /content-type:.*text\/html/i.test(subHeader);
      const isBase64 = /content-transfer-encoding:.*base64/i.test(subHeader);
      const isQP = /content-transfer-encoding:.*quoted-printable/i.test(subHeader);

      let parsedContent = subBody;
      if (isBase64) {
        try {
          parsedContent = Buffer.from(subBody.replace(/\s+/g, ''), 'base64').toString('utf8');
        } catch (e) {}
      } else if (isQP) {
        parsedContent = decodeQuotedPrintable(subBody);
      }

      if (isHtml) {
        bodyHtml = parsedContent;
      } else if (!bodyText) {
        bodyText = parsedContent;
      }
    }
  } else {
    const isBase64 = /base64/i.test(headers['content-transfer-encoding'] || '');
    const isQP = /quoted-printable/i.test(headers['content-transfer-encoding'] || '');
    let content = bodyBlock;
    if (isBase64) {
      try {
        content = Buffer.from(bodyBlock.replace(/\s+/g, ''), 'base64').toString('utf8');
      } catch (e) {}
    } else if (isQP) {
      content = decodeQuotedPrintable(bodyBlock);
    }

    if (/text\/html/i.test(contentType)) {
      bodyHtml = content;
    } else {
      bodyText = content;
    }
  }

  return {
    subject: headers['subject'] || '(Không có tiêu đề)',
    from: headers['from'] || '(Không rõ người gửi)',
    to: headers['to'] || '',
    date: headers['date'] || new Date().toISOString(),
    messageId: headers['message-id'] || '',
    bodyText: bodyText.trim(),
    bodyHtml: bodyHtml.trim() || bodyText.trim()
  };
}

export class ImapMailService {
  constructor(options = {}) {
    this.host = options.host || process.env.IMAP_HOST || 'nckh.anhvoli.id.vn';
    this.port = options.port || Number(process.env.IMAP_PORT || 993);
    this.user = options.user;
    this.password = options.password;
    this.tagCount = 0;
  }

  getNextTag() {
    this.tagCount++;
    return `A${this.tagCount}`;
  }

  async executeSession(callback) {
    return new Promise((resolve, reject) => {
      let socket;
      try {
        socket = tls.connect(this.port, this.host, { rejectUnauthorized: false });
      } catch (err) {
        return reject(new Error(`Không thể khởi tạo kết nối TLS: ${err.message}`));
      }

      let buffer = '';
      let currentResolver = null;

      socket.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        if (currentResolver) {
          currentResolver(buffer);
        }
      });

      socket.on('error', (err) => {
        reject(new Error(`Lỗi kết nối IMAP (${this.host}:${this.port}): ${err.message}`));
      });

      socket.setTimeout(25000, () => {
        socket.destroy();
        reject(new Error('Hết thời gian chờ kết nối máy chủ IMAP (Timeout 25s)'));
      });

      const sendCommand = (cmd, customTag = null) => {
        return new Promise((cmdResolve, cmdReject) => {
          const tag = customTag || this.getNextTag();
          buffer = '';

          currentResolver = (currentBuf) => {
            const lines = currentBuf.split(/\r?\n/);
            for (const line of lines) {
              if (line.startsWith(`${tag} OK`)) {
                currentResolver = null;
                return cmdResolve({ success: true, text: currentBuf, tag });
              }
              if (line.startsWith(`${tag} NO`) || line.startsWith(`${tag} BAD`)) {
                currentResolver = null;
                const errText = line.substring(tag.length).trim();
                return cmdReject(new Error(`Lỗi IMAP: ${errText}`));
              }
            }
          };

          socket.write(`${tag} ${cmd}\r\n`);
        });
      };

      currentResolver = (currentBuf) => {
        if (currentBuf.includes('* OK')) {
          currentResolver = null;
          callback(sendCommand, socket)
            .then((result) => {
              try {
                socket.write(`${this.getNextTag()} LOGOUT\r\n`);
                setTimeout(() => socket.destroy(), 500);
              } catch (e) {}
              resolve(result);
            })
            .catch((err) => {
              try { socket.destroy(); } catch (e) {}
              reject(err);
            });
        }
      };
    });
  }

  async getInbox(limit = 20) {
    if (!this.user || !this.password) {
      throw new Error('Thiếu thông tin: user (email) và password để kết nối IMAP.');
    }

    return this.executeSession(async (send) => {
      await send(`LOGIN "${this.user}" "${this.password}"`);
      await send('SELECT "INBOX"');
      const searchRes = await send('SEARCH ALL');

      const searchMatch = searchRes.text.match(/\* SEARCH ([\d\s]+)/);
      if (!searchMatch || !searchMatch[1].trim()) {
        return { mailbox: this.user, total: 0, messages: [] };
      }

      const allIds = searchMatch[1].trim().split(/\s+/).map(Number).filter(Boolean);
      const total = allIds.length;
      const targetIds = allIds.slice(-limit).reverse();

      const messages = [];
      for (const msgId of targetIds) {
        try {
          const fetchRes = await send(`FETCH ${msgId} (FLAGS RFC822)`);
          const rawText = fetchRes.text;

          let rfcContent = '';
          const literalMatch = rawText.match(/\{(\d+)\}\r?\n([\s\S]+)/);
          if (literalMatch) {
            rfcContent = literalMatch[2];
          } else {
            const lines = rawText.split(/\r?\n/);
            rfcContent = lines.slice(1, -2).join('\n');
          }

          const parsed = parseRawEmail(rfcContent);
          const isSeen = rawText.includes('\\Seen');

          messages.push({
            id: msgId,
            seen: isSeen,
            subject: parsed.subject,
            from: parsed.from,
            to: parsed.to,
            date: parsed.date,
            messageId: parsed.messageId,
            snippet: parsed.bodyText.slice(0, 150).replace(/\s+/g, ' ') || 'Không có bản xem trước',
            bodyText: parsed.bodyText,
            bodyHtml: parsed.bodyHtml
          });
        } catch (fetchErr) {
          console.warn(`Lỗi khi lấy thư #${msgId}:`, fetchErr.message);
        }
      }

      return { mailbox: this.user, total, messages };
    });
  }

  // Tự động tìm và trích xuất mã OTP từ thư mới nhất
  async getLatestOtp() {
    const inbox = await this.getInbox(5);
    if (!inbox.messages || inbox.messages.length === 0) {
      return { success: false, message: 'Hộp thư hiện đang trống, chưa có email nào.' };
    }

    const latest = inbox.messages[0];
    const fullContent = `${latest.subject} ${latest.bodyText}`;

    // Regex bóc tách mã xác nhận: 4 - 8 chữ số
    // Hỗ trợ các mẫu: "mã xác nhận: 123456", "verification code: 123456", "code is 123456", v.v.
    const patterns = [
      /(?:code|mã|otp|verification|pin)[^\d]{1,15}(\d{4,8})\b/i,
      /\b(\d{6})\b/, // 6 số chuẩn Google/Discord/Steam
      /\b(\d{4})\b/, // 4 số
      /\b(\d{8})\b/  // 8 số
    ];

    let extractedOtp = null;
    for (const pat of patterns) {
      const match = fullContent.match(pat);
      if (match && match[1]) {
        extractedOtp = match[1];
        break;
      }
    }

    return {
      success: true,
      otp: extractedOtp,
      subject: latest.subject,
      from: latest.from,
      date: latest.date,
      preview: latest.snippet
    };
  }
}

/**
 * =========================================================================
 * 3. SMTP SERVICE (Port 465 SSL)
 * =========================================================================
 */
export class SmtpMailService {
  constructor(options = {}) {
    this.host = options.host || process.env.SMTP_HOST || 'nckh.anhvoli.id.vn';
    this.port = options.port || Number(process.env.SMTP_PORT || 465);
    this.user = options.user;
    this.password = options.password;
  }

  async sendMail({ to, subject, text, html }) {
    if (!this.user || !this.password) {
      throw new Error('Cần thông tin user và password của hộp thư để gửi qua SMTP.');
    }
    if (!to) {
      throw new Error('Vui lòng cung cấp địa chỉ người nhận (to).');
    }

    return new Promise((resolve, reject) => {
      let socket;
      try {
        socket = tls.connect(this.port, this.host, { rejectUnauthorized: false });
      } catch (err) {
        return reject(new Error(`Không thể khởi tạo TLS SMTP: ${err.message}`));
      }

      let buffer = '';
      let currentStep = 0;

      const steps = [
        () => `EHLO localhost\r\n`,
        () => `AUTH LOGIN\r\n`,
        () => `${Buffer.from(this.user).toString('base64')}\r\n`,
        () => `${Buffer.from(this.password).toString('base64')}\r\n`,
        () => `MAIL FROM:<${this.user}>\r\n`,
        () => `RCPT TO:<${to.trim()}>\r\n`,
        () => `DATA\r\n`,
        () => {
          const boundary = '----=_Part_' + Date.now();
          const rfcDate = new Date().toUTCString();
          const encodedSubject = `=?UTF-8?B?${Buffer.from(subject || 'Không có tiêu đề').toString('base64')}?=`;

          return [
            `From: <${this.user}>`,
            `To: <${to.trim()}>`,
            `Subject: ${encodedSubject}`,
            `Date: ${rfcDate}`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/alternative; boundary="${boundary}"`,
            ``,
            `--${boundary}`,
            `Content-Type: text/plain; charset=UTF-8`,
            `Content-Transfer-Encoding: base64`,
            ``,
            Buffer.from(text || html || '').toString('base64'),
            ``,
            `--${boundary}`,
            `Content-Type: text/html; charset=UTF-8`,
            `Content-Transfer-Encoding: base64`,
            ``,
            Buffer.from(html || text || '').toString('base64'),
            ``,
            `--${boundary}--`,
            `.`
          ].join('\r\n') + '\r\n';
        },
        () => `QUIT\r\n`
      ];

      socket.on('data', (chunk) => {
        const response = chunk.toString();
        buffer += response;

        const codeMatch = response.match(/^([45]\d\d)/m);
        if (codeMatch) {
          socket.destroy();
          return reject(new Error(`Lỗi SMTP (${codeMatch[1]}): ${response.trim()}`));
        }

        if (/^\d{3}\s/m.test(response) || (currentStep === 7 && /250\s/.test(response))) {
          if (currentStep < steps.length) {
            const nextCmd = steps[currentStep]();
            currentStep++;
            socket.write(nextCmd);
          } else {
            socket.destroy();
            resolve({
              success: true,
              message: `Đã gửi thư thành công đến ${to}`
            });
          }
        }
      });

      socket.on('error', (err) => reject(new Error(`Lỗi socket SMTP: ${err.message}`)));
      socket.setTimeout(20000, () => {
        socket.destroy();
        reject(new Error('Hết thời gian chờ SMTP (Timeout 20s)'));
      });
    });
  }
}

export function generateStrongPass() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
  let pass = 'Mk@';
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}
