# 📨 cPanel Webmail & Mailbox API Suite (React + Node.js)

Dự án Fullstack chuyên dụng giúp **tự động tạo hộp thư mới qua cPanel UAPI** và **đọc thư trong hộp mail trực tiếp qua giao thức IMAP SSL**, dành cho hệ thống máy chủ **`nckh.anhvoli.id.vn`**.

---

## 📌 1. Thông Tin Dùng Chung Hệ Thống

| Mục | Giá trị |
| :--- | :--- |
| **Hosting / Domain chính** | `nckh.anhvoli.id.vn` |
| **Tài khoản cPanel** | `eh8vxynb05pr` |
| **Máy chủ Mail (SSL)** | `nckh.anhvoli.id.vn` |
| **Giao thức IMAP (Đọc thư)** | **Port 993, SSL/TLS** |
| **Giao thức POP3** | Port 995, SSL/TLS |
| **Giao thức SMTP (Gửi thư)** | **Port 465, SSL/TLS** |
| **Cổng cPanel UAPI** | `https://nckh.anhvoli.id.vn:2083/` |
| **Webmail cPanel mặc định** | Cổng 2096 (HTTPS) hoặc Roundcube cổng 443 |

> [!IMPORTANT]
> **Phân biệt rõ 2 loại mật khẩu:**
> 1. **Mật khẩu cPanel / API Token:** Dùng để gọi API quản lý (tạo hộp mail, xóa hộp mail, đổi mật khẩu...). Token tạo tại **cPanel > Security > Manage API Tokens**.
> 2. **Mật khẩu hộp mail:** Mật khẩu riêng của từng hộp mail (do bạn tự đặt lúc tạo hộp), dùng để đăng nhập đọc mail qua **IMAP Port 993** và gửi mail qua **SMTP Port 465**.

---

## 📂 2. Cấu Trúc Thư Mục Dự Án (`webmail/`)

```
webmail/
├── .env                  # Cấu hình Token cPanel và thông số máy chủ (KHÔNG commit lên Git)
├── .env.example          # File mẫu cấu hình
├── server.js             # Backend Express: Proxy cPanel UAPI + IMAP/SMTP Gateway
├── cpanelApi.js          # Module gọi UAPI cPanel (Email/add_pop, list_pops, delete_pop...)
├── imapClient.js         # Module đọc thư IMAP Socket TLS (Port 993 SSL, parse MIME, HTML)
├── smtpClient.js         # Module gửi thư SMTP Socket TLS (Port 465 SSL)
├── package.json          # Danh sách thư viện và scripts
├── vite.config.js        # Cấu hình Vite React và proxy API
├── run_webmail.bat       # Phím tắt 1-click khởi chạy toàn bộ dự án trên Windows
├── index.html            # Trang HTML gốc
└── src/
    ├── main.jsx          # Entrypoint React
    ├── App.jsx           # Giao diện chính: chuyển đổi giữa Quản lý hộp thư & Đọc thư
    ├── index.css         # Styling Tailwind CSS Dark Mode
    ├── components/
    │   ├── MailboxManager.jsx  # Tạo, liệt kê, đổi mật khẩu, xóa hộp mail qua UAPI
    │   ├── WebmailReader.jsx   # Giao diện Webmail đọc thư trực tuyến qua IMAP
    │   ├── ComposeMail.jsx     # Modal soạn và gửi thư qua SMTP
    │   └── ConfigModal.jsx     # Popup cấu hình nhanh Token cPanel trực tiếp trên UI
    └── services/
        └── api.js              # Service kết nối API backend
```

---

## 🚀 3. Hướng Dẫn Khởi Chạy Nhanh

### Cách 1: Khởi động 1-click trên Windows (Khuyên dùng)
* Nhấp đúp chuột vào file: **[`run_webmail.bat`](file:///d:/SHOPKEY-main/webmail/run_webmail.bat)**.
* Hệ thống sẽ tự động bật Backend (Port 5050), Frontend React (Port 5175) và mở trình duyệt web tại:
  👉 **`http://localhost:5175`**

### Cách 2: Chạy bằng lệnh dòng lệnh (Terminal)
1. Mở cửa sổ dòng lệnh tại thư mục `webmail`:
   ```bash
   cd D:\SHOPKEY-main\webmail
   ```
2. Khởi động Backend API:
   ```bash
   node server.js
   ```
3. Mở thêm 1 terminal chạy Frontend:
   ```bash
   npx vite --port 5175
   ```

---

## 🔑 4. Hướng Dẫn Lấy API Token cPanel

1. Đăng nhập vào cPanel: `https://nckh.anhvoli.id.vn:2083/` với tài khoản `eh8vxynb05pr`.
2. Tìm mục **Security (Bảo mật)** > chọn **Manage API Tokens**.
3. Bấm **Create API Token**, đặt tên mô tả (ví dụ: `webmail-tool`).
4. Bấm **Save Token**, sau đó **Sao chép mã Token** ngay lập tức.
5. Cập nhật Token bằng 1 trong 2 cách:
   * **Cách A:** Mở ứng dụng web `http://localhost:5175`, bấm vào biểu tượng **Chìa khóa vàng (Cấu hình)** ở góc trên bên phải > Dán Token > Bấm Lưu.
   * **Cách B:** Mở file `webmail/.env`, dán vào dòng:
     ```env
     CPANEL_TOKEN=MÃ_TOKEN_CỦA_BẠN
     ```

---

## 📖 5. Hướng Dẫn Sử Dụng Các Tính Năng

### 1. Tạo hộp mail tự động qua cPanel UAPI:
* Tại tab **"Quản lý Hộp Thư (UAPI)"**:
  * Nhập tên hộp mail muốn tạo (ví dụ: `test01`, `khachhang`, `support`). Hệ thống tự động ghép với đuôi `@nckh.anhvoli.id.vn`.
  * Nhập mật khẩu hoặc bấm nút **"Tự tạo mật khẩu mạnh"** để tạo ngẫu nhiên.
  * Chọn dung lượng Quota (mặc định 1024 MB = 1 GB).
  * Bấm **"Tạo Hộp Mail Ngay"**.
  * Hộp mail mới sẽ được cPanel tạo tức thì và hiển thị ngay trên danh sách.

### 2. Đọc thư trực tiếp qua IMAP:
* Bấm nút **"Mở Hộp Thư"** ở danh sách hộp mail, hoặc bấm tab **"Đọc Thư (IMAP Port 993)"**.
* Nhập mật khẩu của hộp mail đó và bấm **"Đăng Nhập & Đọc Hộp Thư"**.
* Giao diện Webmail sẽ hiển thị:
  * Danh sách thư bên trái (người gửi, tiêu đề, ngày nhận, nhãn chưa đọc).
  * Nội dung thư bên phải với 2 chế độ:
    * **HTML View:** Hiển thị giao diện email đẹp mắt trong khung an toàn.
    * **Văn bản thô (Text):** Xem nội dung văn bản thuần.
  * Bấm nút **Làm mới (Refresh)** bất kỳ lúc nào để nhận thư mới nhất.

### 3. Soạn & Gửi thư thử nghiệm qua SMTP:
* Bấm nút **"Soạn thư"** trên thanh tiêu đề.
* Nhập địa chỉ người gửi, mật khẩu hộp mail, người nhận, tiêu đề và nội dung.
* Bấm **"Gửi Thư Đi"** để hệ thống kết nối trực tiếp qua SMTP SSL Port 465 gửi thư.

---

## 🛡️ 6. Lưu Ý Bảo Mật & Xử Lý Lỗi
* **Không commit file `.env` chứa token lên Git.**
* **Mật khẩu hộp mail yếu:** Nếu cPanel từ chối tạo hộp thư, hãy đảm bảo mật khẩu có cả chữ hoa, chữ thường, số và ký tự đặc biệt (từ 10 ký tự trở lên). Nút *"Tự tạo mật khẩu mạnh"* trong app đã được tối ưu đạt chuẩn bảo mật này.
* **Đọc mail báo lỗi xác thực:** Kiểm tra bạn đang gõ mật khẩu của chính hộp mail đó, không phải mật khẩu cPanel.
