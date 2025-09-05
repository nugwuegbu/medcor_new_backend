"""
MCP Client for LangChain Integration with Async Support
This module provides an async client to communicate with the MCP server
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import httpx
from django.conf import settings

logger = logging.getLogger(__name__)


@dataclass
class MCPResponse:
    """Response from MCP server"""
    success: bool
    data: Any
    error: Optional[str] = None
    metadata: Optional[Dict] = None


class AsyncMCPClient:
    """Async client for communicating with MCP server"""
    
    def __init__(self, mcp_server_url: str = None):
        self.mcp_server_url = mcp_server_url or getattr(settings, 'MCP_SERVER_URL', 'http://localhost:8001')
        self.timeout = getattr(settings, 'MCP_SERVER_TIMEOUT', 30)
        self._client = None
    
    async def __aenter__(self):
        self._client = httpx.AsyncClient(timeout=self.timeout)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            await self._client.aclose()
    
    async def call_tool(self, tool_name: str, parameters: Dict[str, Any]) -> MCPResponse:
        """Call a specific tool on the MCP server"""
        try:
            payload = {
                "tool": tool_name,
                "parameters": parameters
            }
            
            response = await self._client.post(
                f"{self.mcp_server_url}/call",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return MCPResponse(
                    success=True,
                    data=data.get("result"),
                    metadata=data.get("metadata")
                )
            else:
                return MCPResponse(
                    success=False,
                    data=None,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            logger.error(f"Error calling MCP tool {tool_name}: {str(e)}")
            return MCPResponse(
                success=False,
                data=None,
                error=str(e)
            )
    
    async def list_tools(self) -> MCPResponse:
        """Get list of available tools from MCP server"""
        try:
            response = await self._client.get(f"{self.mcp_server_url}/tools")
            
            if response.status_code == 200:
                data = response.json()
                return MCPResponse(
                    success=True,
                    data=data.get("tools", []),
                    metadata=data.get("metadata")
                )
            else:
                return MCPResponse(
                    success=False,
                    data=None,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            logger.error(f"Error listing MCP tools: {str(e)}")
            return MCPResponse(
                success=False,
                data=None,
                error=str(e)
            )
    
    async def health_check(self) -> MCPResponse:
        """Check if MCP server is healthy"""
        try:
            response = await self._client.get(f"{self.mcp_server_url}/health")
            
            if response.status_code == 200:
                data = response.json()
                return MCPResponse(
                    success=True,
                    data=data,
                    metadata={"status": "healthy"}
                )
            else:
                return MCPResponse(
                    success=False,
                    data=None,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            logger.error(f"Error checking MCP health: {str(e)}")
            return MCPResponse(
                success=False,
                data=None,
                error=str(e)
            )


def get_mcp_client() -> AsyncMCPClient:
    """Get MCP client instance"""
    return AsyncMCPClient()


async def test_mcp_connection() -> bool:
    """Test connection to MCP server"""
    async with get_mcp_client() as client:
        response = await client.health_check()
        return response.success