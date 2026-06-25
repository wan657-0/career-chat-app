#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
职业规划智能体 - 本地HTTP服务器（含API代理）
"""

import http.server
import socketserver
import urllib.request
import urllib.error
import os
import sys
import socket
import json

API_BASE = 'https://maas-api.cn-huabei-1.xf-yun.com'
PORT = 8000
SERVER_VERSION = '1.0.1'

class CORSProxyHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Api-Key, X-Api-Secret')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        if self.path.startswith('/api-proxy'):
            self.handle_api_proxy()
        else:
            super().do_POST()
    
    def do_GET(self):
        if self.path == '/api-health' or self.path == '/api-health/':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'ok',
                'version': SERVER_VERSION,
                'message': '代理服务器运行正常'
            }).encode('utf-8'))
            return
        if self.path.startswith('/api-proxy'):
            self.handle_api_proxy()
        else:
            super().do_GET()
    
    def handle_api_proxy(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b''
            
            api_path = self.path.replace('/api-proxy', '')
            full_url = API_BASE + api_path
            
            print(f"\n{'='*50}")
            print(f"代理请求: {self.command} {api_path}")
            print(f"目标URL: {full_url}")
            
            api_key_full = self.headers.get('X-API-Key', '') or self.headers.get('X-Api-Key', '')
            
            print(f"API Key: {'已设置' if api_key_full else '未设置'}")
            if api_key_full:
                print(f"API Key前缀: {api_key_full[:20]}...")
            
            forward_headers = {}
            for k, v in self.headers.items():
                if k.lower() not in ('host', 'connection', 'content-length', 'authorization', 'date', 'x-api-key', 'x-api-secret'):
                    forward_headers[k] = v
            
            if api_key_full:
                forward_headers['Authorization'] = f'Bearer {api_key_full}'
                print(f"认证方式: Bearer token")
            else:
                print("警告: 未找到API密钥")
            
            print(f"转发请求头: {list(forward_headers.keys())}")
            
            req = urllib.request.Request(
                full_url,
                data=body if body else None,
                headers=forward_headers,
                method=self.command
            )
            
            with urllib.request.urlopen(req, timeout=60) as response:
                response_body = response.read()
                status = response.getcode()
                
                print(f"响应状态: {status}")
                print(f"响应大小: {len(response_body)} bytes")
                
                self.send_response(status)
                for key, value in response.headers.items():
                    if key.lower() not in ('connection', 'transfer-encoding', 'content-encoding'):
                        self.send_header(key, value)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response_body)
                print(f"{'='*50}\n")
                
        except urllib.error.HTTPError as e:
            response_body = e.read()
            print(f"HTTP错误: {e.code}")
            print(f"错误响应: {response_body[:300].decode('utf-8', errors='replace')}")
            self.send_response(e.code)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(response_body)
            print(f"{'='*50}\n")
        except Exception as e:
            print(f"代理异常: {e}")
            import traceback
            traceback.print_exc()
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_msg = f'{{"error": {{"message": "代理服务器错误: {str(e)}"}}}}'
            self.wfile.write(error_msg.encode('utf-8'))
            print(f"{'='*50}\n")

def check_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("", port))
            return False
        except OSError:
            return True

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # 检查端口是否被占用
    if check_port_in_use(PORT):
        print(f"\n{'='*60}")
        print(f"  错误: 端口 {PORT} 已被占用！")
        print(f"{'='*60}")
        print(f"  请关闭旧的服务器后再启动")
        print(f"  或者在任务管理器中结束 python.exe 进程")
        print(f"{'='*60}\n")
        input("按回车键退出...")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"  职业规划智能体服务器 v{SERVER_VERSION}")
    print(f"{'='*60}")
    print(f"  访问地址: http://localhost:{PORT}/职业规划智能体.html")
    print(f"  健康检查: http://localhost:{PORT}/api-health")
    print(f"  API代理:  http://localhost:{PORT}/api-proxy")
    print(f"  工作目录: {script_dir}")
    print(f"{'='*60}")
    print(f"  请在浏览器中打开上面的访问地址")
    print(f"  按 Ctrl+C 停止服务器")
    print(f"{'='*60}\n")
    
    try:
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("", PORT), CORSProxyHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
        sys.exit(0)
    except OSError as e:
        print(f"启动失败: {e}")
        input("按回车键退出...")
        sys.exit(1)

if __name__ == "__main__":
    main()