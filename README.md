# Code Vault — Mã hóa code

Trang web obfuscate / mã hóa nhiều loại code (chạy 100% trên trình duyệt).

## Chạy

Mở `index.html` bằng trình duyệt  
hoặc host static (Netlify Drop, GitHub Pages…).

## Hỗ trợ

| Ngôn ngữ | Phương thức |
|----------|-------------|
| JavaScript | eval/Base64, Function, fromCharCode, XOR, chunks, heavy |
| Python | exec+base64, hex, XOR, heavy junk |
| HTML | entities, data-URI, junk |
| CSS | minify+junk, unicode escape |
| Lua | string.char, load, heavy |
| PHP | eval+base64 |
| JSON | Base64 wrap |
| Text | Base64, Hex, Reverse, XOR, ROT13 |

## File

```
code-obfuscator/
├── index.html
├── css/style.css
├── js/obfuscators.js
├── js/app.js
└── README.md
```
