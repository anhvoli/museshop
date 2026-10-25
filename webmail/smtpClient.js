import tls from 'tls';

/**
 * Class gửi thư SMTP TLS (Port 465)
 */
export class SmtpClient {
  constructor(options = {}) {
    this.host = options.host || process.env.SMTP_HOST || 'nckh.anhvoli.id.vn';
    this.port = options.port || process.env.SMTP_PORT || 465;
    this.user = options.user;
    this.password = options.password;
  }

  async sendMail({ to, subject, text, html }) {
    if (!this.user || !this.password) {
      throw new Error('Cần thông tin tài khoản và mật khẩu hộp mail để gửi qua SMTP.');
    }
    if (!to) {
      throw new Error('Vui lòng nhập địa chỉ người nhận.');
    }

    return new Promise((resolve, reject) => {
      let socket;
      try {
        socket = tls.connect(this.port, this.host, { rejectUnauthorized: false });
      } catch (err) {
        return reject(new Error(`Không thể khởi tạo TLS socket SMTP: ${err.message}`));
      }

      let buffer = '';
      let currentStep = 0;

      const steps = [
        // 0. Greeting received -> Send EHLO
        () => `EHLO localhost\r\n`,
        // 1. EHLO response -> Send AUTH LOGIN
        () => `AUTH LOGIN\r\n`,
        // 2. Username prompt -> Send Base64 Username
        () => `${Buffer.from(this.user).toString('base64')}\r\n`,
        // 3. Password prompt -> Send Base64 Password
        () => `${Buffer.from(this.password).toString('base64')}\r\n`,
        // 4. Auth success -> Send MAIL FROM
        () => `MAIL FROM:<${this.user}>\r\n`,
        // 5. Sender OK -> Send RCPT TO
        () => `RCPT TO:<${to.trim()}>\r\n`,
        // 6. Recipient OK -> Send DATA
        () => `DATA\r\n`,
        // 7. Ready for data -> Send Headers + Body + "."
        () => {
          const boundary = '----=_Part_' + Date.now();
          const rfcDate = new Date().toUTCString();
          const encodedSubject = `=?UTF-8?B?${Buffer.from(subject || 'Không có tiêu đề').toString('base64')}?=`;

          const emailContent = [
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

          return emailContent;
        },
        // 8. Mail accepted -> Send QUIT
        () => `QUIT\r\n`
      ];

      socket.on('data', (chunk) => {
        const response = chunk.toString();
        buffer += response;

        // Kiểm tra lỗi SMTP (mã 4xx hoặc 5xx)
        const codeMatch = response.match(/^([45]\d\d)/m);
        if (codeMatch) {
          socket.destroy();
          return reject(new Error(`Lỗi SMTP (${codeMatch[1]}): ${response.trim()}`));
        }

        // Nếu là dòng kết thúc bước hiện tại (mã 2xx hoặc 3xx)
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

      socket.on('error', (err) => {
        reject(new Error(`Lỗi socket SMTP: ${err.message}`));
      });

      socket.setTimeout(20000, () => {
        socket.destroy();
        reject(new Error('Hết thời gian chờ SMTP (Timeout 20s)'));
      });
    });
  }
}

export default SmtpClient;
