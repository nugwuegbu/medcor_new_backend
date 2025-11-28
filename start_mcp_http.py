#!/usr/bin/env python3
"""
HTTP Server Wrapper for FastMCP Server
Provides HTTP endpoints for MCP tools on port 8001
"""

import os
import sys
import json
import asyncio
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medcor_backend2.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

# Import the MCP server instance
from mcp_server import mcp

# Create FastAPI app
app = FastAPI(title="MedCor MCP Server HTTP API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "MCP Server"}

@app.get("/tools")
async def list_tools():
    """List all available MCP tools"""
    try:
        # Get tools from FastMCP server
        tools = []
        # FastMCP tools are registered, we need to extract them
        # This is a simplified version - FastMCP may have different API
        return {"tools": [], "message": "Use /tools/{tool_name} to call tools"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tools/{tool_name}")
async def call_tool(tool_name: str, parameters: Dict[str, Any] = None):
    """Call a specific MCP tool"""
    try:
        if parameters is None:
            parameters = {}
        
        # For now, return a placeholder since FastMCP STDIO doesn't directly support HTTP
        # This would need proper integration with FastMCP's internal tool registry
        return {
            "success": False,
            "error": "Direct HTTP access to FastMCP tools requires additional setup. Use STDIO transport or implement proper HTTP adapter.",
            "tool_name": tool_name,
            "parameters": parameters
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("Starting MCP Server HTTP API on port 8001...")
    print("Note: FastMCP uses STDIO transport by default.")
    print("For full functionality, use the MCP client with STDIO transport.")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")

































