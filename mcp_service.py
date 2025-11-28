#!/usr/bin/env python3
"""Systemd wrapper for the MedCor MCP server using FastMCP SSE helpers."""

from __future__ import annotations

import asyncio
import logging
import os
import signal
import sys
import time

try:
    import uvicorn
except ModuleNotFoundError as exc:  # pragma: no cover - guard for misconfigured envs
    raise RuntimeError(
        "uvicorn is required to run the MCP SSE transport. Install it with 'pip install uvicorn'."
    ) from exc

LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - mcp-server - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stderr)],
)
logger = logging.getLogger("mcp-server")

HOST = os.getenv("MCP_HOST", "127.0.0.1")
PORT = int(os.getenv("MCP_PORT", "8005"))
LOG_LEVEL = os.getenv("MCP_LOG_LEVEL", "info")
RETRY_DELAY = int(os.getenv("MCP_RETRY_DELAY", "5"))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medcor_backend2.settings")

import django  # noqa: E402  # type: ignore


django.setup()

from mcp_server import mcp  # noqa: E402


def _get_debug_flag() -> bool:
    settings = getattr(mcp, "settings", None)
    if settings is None:
        return False
    return bool(getattr(settings, "debug", False))


def _build_sse_app():
    try:
        from mcp.server.sse import SseServerTransport
        from starlette.applications import Starlette
        from starlette.requests import Request
        from starlette.responses import Response
        from starlette.routing import Route
    except ModuleNotFoundError as exc:  # pragma: no cover - missing optional deps
        raise RuntimeError(
            "Unable to build the SSE transport because starlette or MCP SSE helpers are missing."
        ) from exc

    transport = SseServerTransport("/messages")

    async def handle_sse(request: Request) -> Response:
        async with transport.connect_sse(
            request.scope, request.receive, request._send
        ) as streams:
            await mcp._mcp_server.run(  # pylint: disable=protected-access
                streams[0],
                streams[1],
                mcp._mcp_server.create_initialization_options(),  # pylint: disable=protected-access
            )
        return Response()

    async def handle_messages(request: Request) -> Response:
        await transport.handle_post_message(
            request.scope, request.receive, request._send
        )
        return Response()

    routes = [
        Route("/sse", endpoint=handle_sse),
        Route("/messages", endpoint=handle_messages, methods=["POST"]),
    ]

    return Starlette(debug=_get_debug_flag(), routes=routes)


async def run_server() -> None:
    app = _build_sse_app()

    config = uvicorn.Config(
        app,
        host=HOST,
        port=PORT,
        log_level=LOG_LEVEL.lower(),
        timeout_graceful_shutdown=0,
        lifespan="on",
    )
    server = uvicorn.Server(config)
    await server.serve()


def main() -> None:
    logger.info("Starting MCP server (SSE transport) on http://%s:%d", HOST, PORT)

    def handle_signal(signum, frame):
        logger.info("Received signal %s, exiting MCP server", signum)
        sys.exit(0)

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    while True:
        try:
            asyncio.run(run_server())
            break
        except SystemExit:
            logger.info("MCP server stopped")
            break
        except KeyboardInterrupt:
            logger.info("MCP server service stopped")
            break
        except Exception as exc:  # pylint: disable=broad-except
            logger.exception("MCP server error: %s", exc)
            logger.info("Retrying in %s seconds...", RETRY_DELAY)
            time.sleep(RETRY_DELAY)


if __name__ == "__main__":
    main()
