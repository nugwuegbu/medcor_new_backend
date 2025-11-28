"""
MCP Client for LangChain Integration with Async Support
This module provides an async client to communicate with the MCP server
with automatic hospital context extraction from authenticated users
"""

import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

import httpx
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)


@dataclass
class MCPResponse:
    """Response from MCP server"""

    success: bool
    data: Any
    error: Optional[str] = None
    metadata: Optional[Dict] = None


class AsyncMCPClient:
    """Async client for communicating with MCP server with hospital context"""

    def __init__(self, mcp_server_url: str = None, user: Optional[User] = None):
        self.mcp_server_url = mcp_server_url or getattr(
            settings, "MCP_SERVER_URL", "http://localhost:8001"
        )
        self.timeout = getattr(settings, "MCP_SERVER_TIMEOUT", 30)
        self.user = user
        self._client = None
        self._hospital_id = None
        
        # Extract hospital context from user
        if user and hasattr(user, 'hospital') and user.hospital:
            self._hospital_id = str(user.hospital.id)

    async def __aenter__(self):
        self._client = httpx.AsyncClient(timeout=self.timeout)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            await self._client.aclose()

    def _inject_hospital_context(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Automatically inject hospital context into MCP tool parameters"""
        if not self._hospital_id:
            return parameters
            
        # List of tools that require hospital_id
        hospital_aware_tools = {
            'list_users', 'list_doctors', 'list_appointments', 'list_medical_records',
            'list_treatments', 'create_appointment', 'create_medical_record', 
            'create_treatment', 'list_appointment_slots', 'get_doctors_by_specialty',
            'get_todays_appointments', 'get_upcoming_appointments'
        }
        
        # If this tool needs hospital context and it's not already provided
        if any(tool in tool_name for tool_name in [parameters.get('tool_name', '')] if tool_name) or \
           any(tool in str(parameters) for tool in hospital_aware_tools):
            if 'hospital_id' not in parameters:
                parameters['hospital_id'] = self._hospital_id
                
        return parameters

    async def call_tool(
        self, tool_name: str, parameters: Dict[str, Any]
    ) -> MCPResponse:
        """Call a specific tool on the MCP server with automatic hospital context injection"""
        try:
            # Inject hospital context into parameters
            parameters = self._inject_hospital_context(parameters)
            
            # Call the HTTP MCP server
            response = await self._client.post(
                f"{self.mcp_server_url}/tools/{tool_name}",
                json=parameters,
                headers={"Content-Type": "application/json"},
            )

            if response.status_code == 200:
                data = response.json()
                return MCPResponse(
                    success=True, 
                    data=data.get("result") or data, 
                    metadata=data.get("metadata", {})
                )
            else:
                return MCPResponse(
                    success=False,
                    data=None,
                    error=f"HTTP {response.status_code}: {response.text}",
                )

        except Exception as e:
            logger.error(f"Error calling MCP tool {tool_name}: {str(e)}")
            return MCPResponse(success=False, data=None, error=str(e))

    async def list_tools(self) -> MCPResponse:
        """Get list of available tools from MCP server"""
        try:
            response = await self._client.get(f"{self.mcp_server_url}/tools")

            if response.status_code == 200:
                data = response.json()
                return MCPResponse(
                    success=True,
                    data=data.get("tools", []),
                    metadata=data.get("metadata"),
                )
            else:
                return MCPResponse(
                    success=False,
                    data=None,
                    error=f"HTTP {response.status_code}: {response.text}",
                )

        except Exception as e:
            logger.error(f"Error listing MCP tools: {str(e)}")
            return MCPResponse(success=False, data=None, error=str(e))

    async def health_check(self) -> MCPResponse:
        """Check if MCP server is healthy"""
        try:
            # Try to get the list of tools as a health check
            response = await self._client.get(f"{self.mcp_server_url}/tools")

            if response.status_code == 200:
                data = response.json()
                return MCPResponse(
                    success=True, 
                    data={"status": "healthy", "tools_available": len(data.get("tools", []))}, 
                    metadata={"status": "healthy"}
                )
            else:
                return MCPResponse(
                    success=False,
                    data=None,
                    error=f"HTTP {response.status_code}: {response.text}",
                )

        except Exception as e:
            logger.error(f"Error checking MCP health: {str(e)}")
            return MCPResponse(success=False, data=None, error=str(e))


def get_mcp_client(user: Optional[User] = None) -> AsyncMCPClient:
    """Get MCP client instance with optional user context"""
    return AsyncMCPClient(user=user)


async def test_mcp_connection() -> bool:
    """Test connection to MCP server"""
    async with get_mcp_client() as client:
        response = await client.health_check()
        return response.success
