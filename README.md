 <h1 align="center">Hi 👋, I'm Mob</h1>
<h3 align="center">Join the Cryptocurrency Market, make money from Airdrop - Retroactive with me</h3>

- <p align="left"> <img src="https://komarev.com/ghpvc/?username=mobonchain&label=Profile%20views&color=0e75b6&style=flat" alt="mobonchain" /> <a href="https://github.com/mobonchain"> <img src="https://img.shields.io/github/followers/mobonchain?label=Follow&style=social" alt="Follow" /> </a> </p>

- [![TopAME | Bullish - Cheerful](https://img.shields.io/badge/TopAME%20|%20Bullish-Cheerful-blue?logo=telegram&style=flat)](https://t.me/xTopAME)

# Hướng Dẫn Cài Đặt Auto Ref - Start Node Dự Án Monad Score
- **Chức năng:** Bao gồm hỗ trợ người dùng **Ref** cho tài khoản chính, và **kích hoạt Node** hàng ngày cho tài khoản phụ
---

## Yêu cầu

- **Proxy** và **Địa chỉ ví EVM**
- **Cài Node.js nếu chưa có ( Windows ): https://t.me/ToolboxforAirdrop/4**

---

## Cấu Trúc File Dữ Liệu

1. **proxy.txt**:
   - Mỗi dòng chứa một proxy theo định dạng:
     ```
     https://username1:pass@host:port
     https://username2:pass@host:port
     ```

2. **wallet.txt**:
   - Mỗi dòng chứa một địa chỉ ví EVM
   - Định dạng:
     ```
     0xYourWalletAddress1
     0xYourWalletAddress1
     ```

---

## Cài Đặt Trên Windows

### Bước 1: Tải và Giải Nén File

1. Nhấn vào nút **<> Code"** màu xanh lá cây, sau đó chọn **Download ZIP**.
2. Giải nén file ZIP vào thư mục mà bạn muốn lưu trữ.

### Bước 2: Cấu Hình Proxy, Wallet và Token

1. Mở file `proxy.txt` và nhâp vào danh sách `Proxy` theo cấu trúc dữ liệu phía trên
2. Mở file `wallet.txt` và nhập vào `Địa chỉ ví` của các ví EVM bạn muốn sử dụng

### Bước 3: Cài Đặt Module

1. Mở **Command Prompt (CMD)** hoặc **PowerShell** trong thư mục chứa mã nguồn.
2. Cài đặt các module yêu cầu bằng lệnh:
   ```bash
   npm install
   ```

### Bước 4: Chạy Tool

1. Chạy Ref:
   ```bash
   node ref.js
   ```
2. Tự động Start Node
   ```bash
   node startNode.js
   ```

---

## Nếu gặp phải bất kỳ vấn đề nào có thể hỏi thêm tại **[TopAME | Chat - Supports](https://t.me/yTopAME)**
