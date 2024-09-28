# Hướng dẫn chạy source bằng `http-server`

## Yêu cầu
- Node.js phải được cài đặt trên máy tính của bạn. Bạn có thể tải Node.js tại [nodejs.org](https://nodejs.org/).

## Bước 1: Cài đặt http-server
Để cài đặt `http-server` trên máy tính của bạn, hãy mở terminal hoặc command prompt và chạy lệnh sau:

```bash
npm install -g http-server
```

## Bước 2: Di chuyển đến thư mục chứa mã covid-gis-vn
Sử dụng terminal hoặc command prompt, điều hướng đến thư mục chứa file dự án của bạn.

```bash
cd ~./covid-gis-vn
```

## Bước 3: Chạy http-server
Khi đã ở trong thư mục chứa source code của bạn, chạy lệnh sau để khởi động máy chủ HTTP:

```bash
http-server
```

Lệnh này sẽ khởi động một máy chủ HTTP đơn giản và hiển thị địa chỉ URL mà bạn có thể truy cập trang web của mình, chẳng hạn như:

```bash
Starting up http-server, serving ./ 
Available on:
  http://127.0.0.1:8080
  http://192.168.1.100:8080
Hit CTRL-C to stop the server
```

## Bước 4: Truy cập trang web
Mở trình duyệt và truy cập vào địa chỉ URL mà `http-server` cung cấp, ví dụ: `http://127.0.0.1:8080`.

## Ghi chú
Trong một số trường hợp xấu. Dữ liệu không load khi tải trang. Bạn có thể di chuyển chuột đến vùng Maps `Zoom in`, `Zoom out` hoặc chọn lại ngày tháng để có thể load được dữ liệu
**Trong thư mục /diagram là các mã để tạo diagram. bạn có thể dùng [mermaid](https://mermaid.js.org/) và [plantuml](https://plantuml.com/activity-diagram-beta) để running chúng.**