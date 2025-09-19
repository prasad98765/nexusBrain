# #!/usr/bin/env python3
# """
# Development server runner for Nexus AI platform
# Runs both Flask backend and Vite frontend concurrently
# """

# import os
# import sys
# import subprocess
# import time
# import signal
# from threading import Thread

# def run_backend():
#     """Run Flask backend server"""
#     print("🚀 Starting Flask backend...")
#     env = os.environ.copy()
#     env['PYTHONPATH'] = '.'
#     env['FLASK_ENV'] = 'development'
    
#     try:
#         subprocess.run([
#             sys.executable, 'server/app.py'
#         ], env=env, check=False)
#     except KeyboardInterrupt:
#         print("\n🛑 Flask backend stopped")

# def run_frontend():
#     """Run Vite frontend server"""
#     print("🚀 Starting Vite frontend...")
#     time.sleep(2)  # Give backend a moment to start
    
#     try:
#         subprocess.run(['npm', 'run', 'dev'], check=False)
#     except KeyboardInterrupt:
#         print("\n🛑 Vite frontend stopped")

# def signal_handler(sig, frame):
#     """Handle Ctrl+C gracefully"""
#     print("\n🛑 Stopping development servers...")
#     sys.exit(0)

# if __name__ == '__main__':
#     signal.signal(signal.SIGINT, signal_handler)
    
#     print("🔥 Starting Nexus AI Development Servers")
#     print("=" * 50)
    
#     # Start backend in a separate thread
#     backend_thread = Thread(target=run_backend, daemon=True)
#     backend_thread.start()
    
#     # Start frontend in main thread
#     try:
#         run_frontend()
#     except KeyboardInterrupt:
#         print("\n👋 Development servers stopped")
#         sys.exit(0)