#!/usr/bin/env python3
"""
MedCor.ai MCP Server Runner
Starts the MCP server with healthcare management tools
"""

import os
import sys
import django
from pathlib import Path

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')

try:
    django.setup()
    print("✅ Django environment configured successfully")
except Exception as e:
    print(f"❌ Failed to configure Django: {e}")
    sys.exit(1)

# Import and run MCP server
try:
    from mcp_server import mcp, FASTMCP_AVAILABLE
    
    if FASTMCP_AVAILABLE:
        print("🚀 Starting MedCor.ai MCP Server with FastMCP...")
        mcp.run()
    else:
        print("⚠️  FastMCP not available, running mock server...")
        mcp.run()
        
        # Display available tools, resources, and prompts
        print("\n" + "="*60)
        print("🔧 Available MCP Tools:")
        for i, tool_name in enumerate(mcp.tools.keys(), 1):
            print(f"   {i:2d}. {tool_name}")
        
        print("\n📁 Available MCP Resources:")
        for i, resource_uri in enumerate(mcp.resources.keys(), 1):
            print(f"   {i:2d}. {resource_uri}")
        
        print("\n📝 Available MCP Prompts:")
        for i, prompt_name in enumerate(mcp.prompts.keys(), 1):
            print(f"   {i:2d}. {prompt_name}")
        
        print("\n💡 To use these tools:")
        print("   1. Connect MCP client to this server")
        print("   2. Call tools using their function names")
        print("   3. Access resources using their URIs")
        print("   4. Use prompts for guided workflows")
        
except ImportError as e:
    print(f"❌ Failed to import MCP server: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ MCP server error: {e}")
    sys.exit(1)