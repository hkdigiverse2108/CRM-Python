"""
Logging Middleware
==================
Logs incoming request details (method, path, client host) and outgoing response 
details (status code, duration in milliseconds).
"""

import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from backend.app.utils.logger import get_logger

logger = get_logger("middleware.logging")


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs each HTTP request and response.
    
    Logs:
    - HTTP Method
    - Request Path
    - Client IP / Host
    - Response HTTP status code
    - Process time (duration in milliseconds)
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        
        method = request.method
        path = request.url.path
        client_host = request.client.host if request.client else "unknown"
        
        logger.info(f"Incoming request: {method} {path} from {client_host}")
        
        try:
            response = await call_next(request)
            
            process_time_ms = (time.perf_counter() - start_time) * 1000.0
            logger.info(
                f"Outgoing response: {method} {path} - "
                f"Status: {response.status_code} - "
                f"Duration: {process_time_ms:.2f}ms"
            )
            return response
            
        except Exception as e:
            process_time_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(
                f"Request failed: {method} {path} - "
                f"Error: {str(e)} - "
                f"Duration: {process_time_ms:.2f}ms"
            )
            raise e
