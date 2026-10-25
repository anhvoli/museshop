import tls from 'tls';

/**
 * Hàm giải mã MIME Header (RFC 2047: =?UTF-8?B?...?= hoặc =?UTF-8?Q?...?=)
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

/**
 * Giải mã Quoted-Printable Content
 */
export function decodeQuotedPrintable(str = '') {
  return str
    .replace(/=\r?\n/g, '') // Xóa soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
}

/**
 * Trình phân tích cấu trúc thư RFC822 đơn giản, tin cậy
 */
export function parseRawEmail(raw = '') {
  const parts = raw.split(/\r?\n\r?\n/);
  const headerBlock = parts[0] || '';
  const bodyBlock = parts.slice(1).join('\n\n') || '';

  // Phân tích Headers
  const headers = {};
  const headerLines = headerBlock.split(/\r?\n(?![ \t])/); // Xử lý header multiline folding
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

  // Xử lý Multipart
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
    // Single part
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

/**
 * Class kết nối IMAP TLS Client qua Socket
 */
export class ImapClient {
  constructor(options = {}) {
    this.host = options.host || process.env.IMAP_HOST || 'nckh.anhvoli.id.vn';
    this.port = options.port || process.env.IMAP_PORT || 993;
    this.user = options.user;
    this.password = options.password;
    this.tagCount = 0;
  }

  getNextTag() {
    this.tagCount++;
    return `A${this.tagCount}`;
  }

  /**
   * Kết nối và thực thi chuỗi lệnh IMAP
   */
  async executeSession(callback) {
    return new Promise((resolve, reject) => {
      let socket;
      try {
        socket = tls.connect(this.port, this.host, { rejectUnauthorized: false });
      } catch (err) {
        return reject(new Error(`Không thể khởi tạo TLS socket: ${err.message}`));
      }

      let buffer = '';
      let currentResolver = null;
      let isGreeting = true;

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

      // Hàm gửi lệnh IMAP và đợi phản hồi theo Tag
      const sendCommand = (cmd, customTag = null) => {
        return new Promise((cmdResolve, cmdReject) => {
          const tag = customTag || this.getNextTag();
          buffer = '';

          currentResolver = (currentBuf) => {
            // Kiểm tra xem đã nhận được dòng phản hồi kết thúc lệnh (tag OK / NO / BAD)
            const lines = currentBuf.split(/\r?\n/);
            for (const line of lines) {
              if (line.startsWith(`${tag} OK`)) {
                currentResolver = null;
                return cmdResolve({ success: true, text: currentBuf, tag });
              }
              if (line.startsWith(`${tag} NO`) || line.startsWith(`${tag} BAD`)) {
                currentResolver = null;
                const errText = line.substring(tag.length).trim();
                return cmdReject(new Error(`Lệnh IMAP thất bại: ${errText}`));
              }
            }
          };

          socket.write(`${tag} ${cmd}\r\n`);
        });
      };

      // Đợi lời chào khởi đầu từ IMAP Server
      currentResolver = (currentBuf) => {
        if (currentBuf.includes('* OK')) {
          currentResolver = null;
          isGreeting = false;

          // Bắt đầu phiên làm việc
          callback(sendCommand, socket)
            .then((result) => {
              // Logout an toàn
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

  /**
   * Đăng nhập và lấy danh sách thư trong hộp thư đến (INBOX)
   */
  async getInbox(limit = 20) {
    if (!this.user || !this.password) {
      throw new Error('Cần cung cấp địa chỉ email đầy đủ và mật khẩu hộp mail để đăng nhập IMAP.');
    }

    return this.executeSession(async (send) => {
      // 1. Login
      await send(`LOGIN "${this.user}" "${this.password}"`);

      // 2. Select INBOX
      const selectRes = await send('SELECT "INBOX"');

      // 3. Search All messages
      const searchRes = await send('SEARCH ALL');
      const searchMatch = searchRes.text.match(/\* SEARCH ([\d\s]+)/);
      if (!searchMatch || !searchMatch[1].trim()) {
        return {
          mailbox: this.user,
          total: 0,
          messages: []
        };
      }

      const allIds = searchMatch[1].trim().split(/\s+/).map(Number).filter(Boolean);
      const total = allIds.length;
      const targetIds = allIds.slice(-limit).reverse(); // Lấy N thư mới nhất

      const messages = [];

      for (const msgId of targetIds) {
        try {
          // Lấy toàn bộ nội dung thư RFC822
          const fetchRes = await send(`FETCH ${msgId} (FLAGS RFC822)`);
          const rawText = fetchRes.text;

          // Trích xuất RFC822 body giữa dấu ngoặc kép hoặc literal {bytes}
          let rfcContent = '';
          const literalMatch = rawText.match(/\{(\d+)\}\r?\n([\s\S]+)/);
          if (literalMatch) {
            rfcContent = literalMatch[2];
          } else {
            // Lấy từ sau FETCH line tới trước dòng tag OK
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

      return {
        mailbox: this.user,
        total,
        messages
      };
    });
  }
}

export default ImapClient;
