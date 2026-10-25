# 📡 Tài Liệu REST API Tạo & Đọc Mail (cPanel UAPI + IMAP)

Hệ thống cung cấp bộ REST API chuẩn JSON giúp các ứng dụng khác (Web, Mobile, Tool tự động hóa, Python script, Bot Telegram...) có thể **tạo hộp thư cPanel mới** và **đọc thư / bóc tách mã OTP trực tuyến** qua API.

* **Base URL Máy chủ Webmail:** `http://localhost:5050/api`
* **Base URL Máy chủ Chính (Shopkey):** `http://localhost:5000/api/mail`
* **Domain máy chủ mail:** `nckh.anhvoli.id.vn`
* **cPanel User:** `eh8vxynb05pr`

---

## 📌 BẢNG TỔNG HỢP ENDPOINT

| Phương thức | Đường dẫn (Endpoint) | Mục đích |
| :--- | :--- | :--- |
| `GET` | `/api/mail/list` | Lấy danh sách tất cả hộp mail trên hosting |
| `POST` | `/api/mail/create` | Tạo hộp mail mới qua cPanel UAPI |
| `DELETE` | `/api/mail/delete?email=...` | Xóa một hộp mail |
| `POST` | `/api/mail/password` | Đổi mật khẩu hộp mail |
| `POST` | `/api/mail/inbox` | Đọc danh sách thư trong hộp mail qua **IMAP SSL Port 993** |
| `POST` | `/api/mail/otp` | **Tự động tìm & trích xuất mã OTP / mã xác nhận** từ thư mới nhất |
| `POST` | `/api/mail/send` | Gửi thư qua **SMTP SSL Port 465** |

---

## 🚀 1. API Tạo Hộp Mail Mới (`POST /api/mail/create`)

Tạo một hộp thư mới trên cPanel.

### Headers:
```http
Content-Type: application/json
```

### Request Body:
```json
{
  "email": "test01",
  "password": "MatKhauManh123!@",
  "quota": 1024
}
```
* `email` *(Bắt buộc)*: Tên hộp mail trước dấu `@` (ví dụ `test01`, hệ thống tự gắn `@nckh.anhvoli.id.vn`).
* `password` *(Tùy chọn)*: Mật khẩu hộp thư. Nếu bỏ trống, API sẽ **tự động sinh mật khẩu mạnh** đạt chuẩn cPanel.
* `quota` *(Tùy chọn)*: Dung lượng tính bằng MB (mặc định 1024 = 1GB).

### Response thành công (201 Created):
```json
{
  "success": true,
  "email": "test01@nckh.anhvoli.id.vn",
  "password": "MatKhauManh123!@",
  "quota": 1024,
  "message": "Đã tạo thành công hộp thư test01@nckh.anhvoli.id.vn"
}
```

---

## 📥 2. API Đọc Hộp Thư (`POST /api/mail/inbox`)

Kết nối trực tiếp vào máy chủ **IMAP SSL Port 993**, tải về danh sách thư gần nhất kèm tiêu đề, người gửi, ngày nhận và toàn bộ nội dung HTML / Text.

### Request Body:
```json
{
  "email": "test01@nckh.anhvoli.id.vn",
  "password": "MatKhauManh123!@",
  "limit": 10
}
```

### Response thành công (200 OK):
```json
{
  "success": true,
  "mailbox": "test01@nckh.anhvoli.id.vn",
  "total": 3,
  "messages": [
    {
      "id": 3,
      "seen": false,
      "subject": "Mã xác nhận tài khoản của bạn là 849201",
      "from": "security@service.com",
      "to": "test01@nckh.anhvoli.id.vn",
      "date": "2026-10-25T13:05:00.000Z",
      "snippet": "Chào bạn, mã xác nhận đăng ký tài khoản của bạn là: 849201...",
      "bodyText": "Chào bạn, mã xác nhận đăng ký tài khoản của bạn là: 849201. Mã có hiệu lực trong 5 phút.",
      "bodyHtml": "<div>Chào bạn, mã xác nhận đăng ký tài khoản của bạn là: <b>849201</b>...</div>"
    }
  ]
}
```

---

## ⚡ 3. API Bóc Tách Mã OTP Tự Động (`POST /api/mail/otp`)

API thông minh chuyên dùng cho **Bot / Tool tự động hóa**: Tự động mở hòm thư qua IMAP, lấy thư mới nhất và dùng biểu thức chính quy (Regex) quét tìm mã số xác nhận (4 - 8 chữ số).

### Request Body:
```json
{
  "email": "test01@nckh.anhvoli.id.vn",
  "password": "MatKhauManh123!@"
}
```

### Response thành công (200 OK):
```json
{
  "success": true,
  "otp": "849201",
  "subject": "Mã xác nhận tài khoản của bạn là 849201",
  "from": "security@service.com",
  "date": "2026-10-25T13:05:00.000Z",
  "preview": "Chào bạn, mã xác nhận đăng ký tài khoản của bạn là: 849201..."
}
```

---

## 📋 4. API Lấy Danh Sách Hộp Thư (`GET /api/mail/list`)

### Response (200 OK):
```json
{
  "success": true,
  "total": 2,
  "mailboxes": [
    {
      "email": "info@nckh.anhvoli.id.vn",
      "login": "info@nckh.anhvoli.id.vn",
      "diskquota": "1024",
      "suspended_login": 0
    },
    {
      "email": "test01@nckh.anhvoli.id.vn",
      "login": "test01@nckh.anhvoli.id.vn",
      "diskquota": "1024",
      "suspended_login": 0
    }
  ]
}
```

---

## 🗑️ 5. API Xóa Hộp Mail (`DELETE /api/mail/delete`)

### Query:
`DELETE /api/mail/delete?email=test01@nckh.anhvoli.id.vn`

### Response (200 OK):
```json
{
  "success": true,
  "message": "Đã xóa hộp thư test01@nckh.anhvoli.id.vn"
}
```

---

## ✉️ 6. API Gửi Thư Thử Nghiệm (`POST /api/mail/send`)

Gửi thư trực tiếp qua **SMTP SSL Port 465**.

### Request Body:
```json
{
  "from": "test01@nckh.anhvoli.id.vn",
  "password": "MatKhauManh123!@",
  "to": "nguoinhan@gmail.com",
  "subject": "Thư thử nghiệm từ cPanel API",
  "text": "Xin chào, đây là thư gửi tự động qua SMTP Port 465 SSL.",
  "html": "<p>Xin chào, đây là thư gửi <b>tự động</b> qua SMTP Port 465 SSL.</p>"
}
```

---

## 💻 CODE MẪU GỌI API BẰNG CÁC NGÔN NGỮ

### 🐍 1. Python (Tạo mail và đọc OTP tự động)

```python
import requests
import time

BASE_URL = "http://localhost:5050/api/mail"

# 1. Tạo hộp mail
res = requests.post(f"{BASE_URL}/create", json={
    "email": "user_demo",
    "password": "MatKhauManh@123",
    "quota": 1024
})
data = res.json()
print("Tạo mail thành công:", data["email"])

# Chờ 5 giây nhận thư xác nhận...
time.sleep(5)

# 2. Đọc mã OTP tự động
otp_res = requests.post(f"{BASE_URL}/otp", json={
    "email": "user_demo@nckh.anhvoli.id.vn",
    "password": "MatKhauManh@123"
})
otp_data = otp_res.json()
print("Mã OTP nhận được:", otp_data.get("otp"))
```

---

### 🌐 2. JavaScript / Node.js (fetch)

```javascript
// Đọc danh sách thư trong hộp mail
async function readInbox() {
  const response = await fetch('http://localhost:5050/api/mail/inbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test01@nckh.anhvoli.id.vn',
      password: 'MatKhauManh123!@',
      limit: 5
    })
  });

  const result = await response.json();
  console.log(`Tìm thấy ${result.total} thư:`);
  result.messages.forEach(msg => {
    console.log(`[${msg.date}] Từ: ${msg.from} | Tiêu đề: ${msg.subject}`);
  });
}

readInbox();
```

---

### 🐘 3. PHP (cURL)

```php
<?php
// Gọi API tạo hộp mail mới
$ch = curl_init('http://localhost:5050/api/mail/create');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'client01',
    'password' => 'MatKhauSieuManh123!@'
]));

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
echo "Kết quả: " . $result['message'];
?>
```

---

### 🖥️ 4. cURL (Command Line / Terminal)

```bash
# Tạo hộp mail
curl -X POST "http://localhost:5050/api/mail/create" \
  -H "Content-Type: application/json" \
  -d '{"email":"test02","password":"MatKhauManh123!@"}'

# Đọc mã OTP
curl -X POST "http://localhost:5050/api/mail/otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test02@nckh.anhvoli.id.vn","password":"MatKhauManh123!@"}'
```
