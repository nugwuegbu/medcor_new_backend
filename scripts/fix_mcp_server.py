#!/usr/bin/env python3
"""
Fix MCP Server - Remove @mcp.prompt() decorators
This script fixes the MCP server by replacing @mcp.prompt() with @mcp.tool()
"""

import os
import re

def fix_mcp_server():
    """Fix the MCP server file by replacing prompt decorators with tool decorators."""
    
    mcp_file = "/var/www/html/medcor_backend2/mcp_server.py"
    
    if not os.path.exists(mcp_file):
        print(f"❌ MCP server file not found: {mcp_file}")
        return False
    
    print(f"🔧 Fixing MCP server file: {mcp_file}")
    
    # Read the file
    with open(mcp_file, 'r') as f:
        content = f.read()
    
    # Count occurrences of @mcp.prompt()
    prompt_count = content.count('@mcp.prompt()')
    print(f"📊 Found {prompt_count} @mcp.prompt() decorators")
    
    if prompt_count == 0:
        print("✅ No @mcp.prompt() decorators found - file is already fixed")
        return True
    
    # Replace @mcp.prompt() with @mcp.tool()
    fixed_content = content.replace('@mcp.prompt()', '@mcp.tool()')
    
    # Count replacements made
    tool_count = fixed_content.count('@mcp.tool()')
    print(f"📊 Found {tool_count} @mcp.tool() decorators after fix")
    
    # Write the fixed content back
    with open(mcp_file, 'w') as f:
        f.write(fixed_content)
    
    print(f"✅ Fixed {prompt_count} @mcp.prompt() decorators")
    print("✅ MCP server file updated successfully")
    
    return True

if __name__ == "__main__":
    print("🚀 MCP Server Fix Script")
    print("========================")
    
    if fix_mcp_server():
        print("\n🎉 MCP server fix completed successfully!")
        print("You can now restart the MCP server service:")
        print("  sudo systemctl restart mcp-server")
    else:
        print("\n❌ MCP server fix failed!")
        exit(1)