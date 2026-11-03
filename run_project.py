#!/usr/bin/env python3
"""
ChurnIQ Project Launcher
Run this Python file to start the entire project (backend + frontend)
"""

import subprocess
import sys
import time
import webbrowser
from pathlib import Path

PROJECT_DIR = Path(__file__).parent
PYTHON_PATH = r"C:\Users\Admin\AppData\Local\Python\bin\python.exe"
NODE_PATH = r"C:\Program Files\nodejs"

def check_port_in_use(port):
    """Check if a port is already in use"""
    try:
        import socket
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            result = s.connect_ex(('localhost', port))
            return result == 0
    except:
        return False

def start_backend():
    """Start the FastAPI backend server"""
    if check_port_in_use(8000):
        print("✓ Backend already running on port 8000")
        return None

    print("[1/2] Starting Backend Server...")
    backend_cmd = [
        PYTHON_PATH,
        "-m",
        "uvicorn",
        "backend.app:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
        "--reload"
    ]

    env = dict(subprocess.os.environ)
    env["PYTHONPATH"] = str(PROJECT_DIR)

    process = subprocess.Popen(
        backend_cmd,
        cwd=PROJECT_DIR,
        env=env,
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )

    time.sleep(5)
    if check_port_in_use(8000):
        print("✓ Backend started successfully")
    else:
        print("✗ Backend failed to start")
        return None

    return process

def start_frontend():
    """Start the React frontend server"""
    if check_port_in_use(8081):
        print("✓ Frontend already running on port 8081")
        return None

    print("[2/2] Starting Frontend Server...")
    frontend_dir = PROJECT_DIR / "frontend"

    frontend_cmd = [
        f"{NODE_PATH}\\npm.cmd",
        "run",
        "dev",
        "--",
        "--port",
        "8081"
    ]

    env = dict(subprocess.os.environ)
    env["PATH"] = f"{NODE_PATH};{env.get('PATH', '')}"

    process = subprocess.Popen(
        frontend_cmd,
        cwd=frontend_dir,
        env=env,
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )

    time.sleep(8)
    if check_port_in_use(8081):
        print("✓ Frontend started successfully")
    else:
        print("✗ Frontend failed to start")
        return None

    return process

def main():
    print("=" * 50)
    print("   🚀 Starting ChurnIQ Project")
    print("=" * 50)
    print()

    # Start backend
    backend_process = start_backend()

    # Start frontend
    frontend_process = start_frontend()

    print()
    print("=" * 50)
    print("   ✅ ChurnIQ is Running!")
    print("=" * 50)
    print()
    print("📱 Dashboard: http://localhost:8081")
    print("📚 API Docs:  http://localhost:8000/docs")
    print()

    # Open browser
    print("🌐 Opening dashboard in browser...")
    webbrowser.open("http://localhost:8081")

    print()
    print("✨ Servers are running in separate windows")
    print("💡 Close those windows to stop the servers")
    print()
    print("Press Enter to exit this script (servers will keep running)...")
    input()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n🛑 Script interrupted")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
