import https from 'https';

/**
 * Module giao tiếp với cPanel UAPI (Email Module)
 */
class CPanelApi {
  constructor(config = {}) {
    this.host = config.host || process.env.CPANEL_HOST || 'nckh.anhvoli.id.vn';
    this.port = config.port || process.env.CPANEL_PORT || 2083;
    this.user = config.user || process.env.CPANEL_USER || 'eh8vxynb05pr';
    this.token = config.token || process.env.CPANEL_TOKEN || '';
    this.domain = config.domain || process.env.MAIL_DOMAIN || 'nckh.anhvoli.id.vn';
  }

  /**
   * Gọi UAPI cPanel tổng quát
   */
  async request(endpoint, method = 'GET', data = null) {
    const token = this.token || process.env.CPANEL_TOKEN;
    if (!token || token === 'YOUR_CPANEL_API_TOKEN_HERE') {
      throw new Error('Chưa cấu hình CPANEL_TOKEN trong file .env hoặc cài đặt.');
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
        rejectUnauthorized: false, // Bỏ qua lỗi SSL nếu chứng chỉ tự ký hoặc trung gian
        headers: {
          'Authorization': authHeader,
          'User-Agent': 'NodeJS-cPanel-Client/1.0',
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
            reject(new Error(`cPanel phản hồi không hợp lệ (${res.statusCode}): ${responseBody.slice(0, 200)}`));
          }
        });
      });

      req.on('error', (err) => reject(new Error(`Không thể kết nối đến cPanel: ${err.message}`)));
      req.setTimeout(20000, () => {
        req.destroy();
        reject(new Error('Hết thời gian chờ kết nối cPanel (Timeout 20s)'));
      });

      if (bodyData) {
        req.write(bodyData);
      }
      req.end();
    });
  }

  /**
   * 1. Liệt kê danh sách các hộp thư POP/IMAP
   */
  async listMailboxes() {
    const res = await this.request('Email/list_pops');
    return res.data || [];
  }

  /**
   * 2. Tạo hộp thư mới
   * @param {string} email - Tên trước dấu @ (ví dụ: test01)
   * @param {string} password - Mật khẩu đủ mạnh
   * @param {number} quota - Dung lượng MB (mặc định 1024 = 1GB)
   */
  async createMailbox({ email, password, quota = 1024, domain = null }) {
    // Làm sạch username (loại bỏ @domain nếu người dùng lỡ nhập)
    let cleanEmail = email.trim();
    if (cleanEmail.includes('@')) {
      cleanEmail = cleanEmail.split('@')[0];
    }

    if (!cleanEmail) {
      throw new Error('Tên hộp mail không được để trống.');
    }

    const targetDomain = domain || this.domain;

    const payload = {
      email: cleanEmail,
      domain: targetDomain,
      password: password,
      quota: quota || 1024
    };

    const res = await this.request('Email/add_pop', 'POST', payload);
    return {
      success: true,
      email: `${cleanEmail}@${targetDomain}`,
      message: `Đã tạo thành công hộp thư ${cleanEmail}@${targetDomain}`,
      raw: res
    };
  }

  /**
   * 3. Xóa hộp thư
   * @param {string} fullEmail - Địa chỉ mail đầy đủ (ví dụ: test01@nckh.anhvoli.id.vn)
   */
  async deleteMailbox(fullEmail) {
    const cleanFullEmail = fullEmail.trim();
    const res = await this.request(`Email/delete_pop?email=${encodeURIComponent(cleanFullEmail)}`, 'GET');
    return {
      success: true,
      message: `Đã xóa hộp thư ${cleanFullEmail}`,
      raw: res
    };
  }

  /**
   * 4. Đổi mật khẩu hộp thư
   * @param {string} fullEmail - Địa chỉ mail đầy đủ
   * @param {string} newPassword - Mật khẩu mới
   */
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

export default CPanelApi;
