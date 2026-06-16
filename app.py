"""
Root Application Runner
=======================
Launches both the React (Vite) frontend and FastAPI backend dev servers 
concurrently, coordinating environment variables and lifecycle shutdowns.
"""

import os
import sys
import subprocess
import uvicorn
from dotenv import load_dotenv

# Load unified environment configuration
load_dotenv()


def start_servers():
    app_host = os.getenv("APP_HOST", "0.0.0.0")
    app_port = int(os.getenv("APP_PORT", "8000"))
    frontend_host = os.getenv("FRONTEND_HOST", "localhost")
    frontend_port = os.getenv("FRONTEND_PORT", "5173")

    print("=" * 60)
    print("          AIO CRM Platform — Service Orchestrator")
    print("=" * 60)

    # 1. Start Frontend Dev Server
    print(f"[*] Launching React frontend at http://{frontend_host}:{frontend_port}...")
    frontend_cmd = ["npm", "run", "dev", "--", "--port", str(frontend_port), "--host", "0.0.0.0"]
    
    # Windows requires shell=True to correctly resolve and run npm commands
    is_windows = sys.platform.startswith("win")
    
    try:
        frontend_process = subprocess.Popen(
            frontend_cmd,
            shell=is_windows,
            cwd=os.path.abspath(os.path.dirname(__file__)),
        )
    except Exception as e:
        print(f"[!] Failed to initiate frontend dev server: {e}")
        sys.exit(1)

    # 2. Start Backend API Server
    try:
        print(f"[*] Launching FastAPI backend at http://{app_host}:{app_port}...")
        print(f"[*] Swagger UI available at http://localhost:{app_port}/docs")
        print("-" * 60)
        
        # Start uvicorn synchronously (blocks main thread until interrupt)
        uvicorn.run(
            "backend.app.main:app",
            host=app_host,
            port=app_port,
            reload=True,
            log_level="info",
        )
    except KeyboardInterrupt:
        print("\n[!] Shutdown signal received.")
    finally:
        # 3. Gracefully clean up subprocesses on exit
        print("[*] Shutting down frontend development server...")
        frontend_process.terminate()
        try:
            frontend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            print("[!] Frontend did not shut down in time. Forcing termination...")
            frontend_process.kill()
        print("[*] All processes terminated. Clean exit.")


if __name__ == "__main__":
    start_servers()
