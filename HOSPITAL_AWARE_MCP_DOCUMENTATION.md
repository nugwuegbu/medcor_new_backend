# Hospital-Aware MCP Implementation

## Overview

The MedCor backend now implements hospital-aware MCP (Model Context Protocol) tools, resources, and prompts that automatically filter data based on the authenticated user's hospital context. This ensures proper multi-tenant data isolation and security.

## Key Features

### 🏥 **Automatic Hospital Context Extraction**

- MCP tools automatically extract hospital context from authenticated users
- All data queries are filtered by the user's hospital ID
- Cross-hospital data access is prevented

### 🔒 **Data Isolation**

- Users can only access data from their own hospital
- Hospital context is validated on every MCP tool call
- Proper error handling for unauthorized access attempts

### 🛠️ **Enhanced MCP Client**

- `AsyncMCPClient` now accepts user context
- Automatic hospital context injection into tool parameters
- Seamless integration with existing LangChain AI views

## Implementation Details

### 1. Updated MCP Client (`langchain_ai/mcp_client.py`)

```python
# Create MCP client with user context
async with get_mcp_client(user=request.user) as client:
    response = await client.call_tool("list_doctors", {})
    # Automatically filters by user's hospital
```

**Key Changes:**

- Added `user` parameter to `AsyncMCPClient`
- Automatic hospital context extraction from user
- Hospital context injection into tool parameters
- Support for hospital-aware tools

### 2. Hospital-Aware Tools Wrapper (`langchain_ai/hospital_aware_mcp.py`)

```python
# Get hospital-aware tools
tools = get_hospital_aware_tools(user)

# Use tools with automatic hospital filtering
doctors = tools.list_doctors_with_context()
appointments = tools.list_appointments_with_context()
records = tools.list_medical_records_with_context()
```

**Features:**

- Automatic hospital context validation
- Hospital-specific data filtering
- Statistics and context information
- Error handling for unauthorized access

### 3. Updated LangChain AI Views

**Simple Queries:**

```python
# Pass user context to async processing
result = asyncio.run(
    _process_simple_query_async(query, query_type, context, request.user)
)
```

**Celery Tasks:**

```python
# Celery tasks now include user context
task = process_ai_query_task.delay(task_data, user_id)
```

### 4. Enhanced MCP Server Tools

All MCP tools now include hospital validation:

```python
@mcp.tool()
def list_doctors(hospital_id: str, ...):
    # Validate hospital exists
    try:
        Hospital.objects.get(id=hospital_id)
    except Hospital.DoesNotExist:
        return [{"error": f"Hospital with ID {hospital_id} not found"}]

    # Filter by hospital
    queryset = User.objects.filter(hospital_id=hospital_id, role="DOCTOR")
```

## Hospital-Aware Tools

### Core Tools

- `list_doctors` - Lists doctors in user's hospital
- `list_appointments` - Lists appointments in user's hospital
- `list_medical_records` - Lists medical records in user's hospital
- `list_treatments` - Lists treatments in user's hospital
- `list_users` - Lists users in user's hospital

### Creation Tools

- `create_appointment` - Creates appointment in user's hospital
- `create_medical_record` - Creates medical record in user's hospital
- `create_treatment` - Creates treatment in user's hospital
- `create_user` - Creates user in user's hospital

### Resource Endpoints

- `/hospitals/details/{hospital_id}` - Hospital details
- `/doctors/list/{hospital_id}` - Doctors in hospital
- `/medical_records/list/{hospital_id}` - Medical records in hospital
- `/appointments/today/{hospital_id}` - Today's appointments

## Usage Examples

### 1. Basic Hospital Context Extraction

```python
from langchain_ai.mcp_client import get_mcp_client

async def get_hospital_data(user):
    async with get_mcp_client(user=user) as client:
        # Automatically filters by user's hospital
        response = await client.call_tool("list_doctors", {})
        return response.data
```

### 2. Hospital-Aware Tools

```python
from langchain_ai.hospital_aware_mcp import get_hospital_aware_tools

def get_hospital_statistics(user):
    tools = get_hospital_aware_tools(user)

    # Get hospital context
    context = tools.get_hospital_context()
    print(f"Hospital: {context['hospital_name']}")

    # Get statistics
    stats = tools.get_hospital_statistics()
    print(f"Total doctors: {stats['total_doctors']}")

    # List data with automatic filtering
    doctors = tools.list_doctors_with_context()
    appointments = tools.list_appointments_with_context()
```

### 3. LangChain AI Integration

```python
# In your Django view
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def process_query(request):
    query = request.data.get("query", "")

    # User context is automatically passed
    result = asyncio.run(
        _process_simple_query_async(query, query_type, context, request.user)
    )

    return Response(result)
```

## Security Features

### 1. Hospital Context Validation

- Every MCP tool call validates hospital context
- Users cannot access data from other hospitals
- Proper error messages for unauthorized access

### 2. Data Isolation

- All database queries are filtered by hospital ID
- Cross-hospital data leakage is prevented
- Hospital context is extracted from authenticated user

### 3. Error Handling

- Graceful handling of missing hospital context
- Clear error messages for debugging
- Fallback behavior for edge cases

## Testing

Run the comprehensive test suite:

```bash
python test_hospital_aware_mcp.py
```

**Test Coverage:**

- Hospital context extraction
- MCP client with hospital context
- Hospital-aware tools wrapper
- Cross-hospital data isolation
- Error handling and edge cases

## Configuration

### Environment Variables

```bash
# MCP Server URL
MCP_SERVER_URL=http://localhost:8001

# MCP Server Timeout
MCP_SERVER_TIMEOUT=30
```

### Django Settings

```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... other apps
    'langchain_ai',
]

# Optional: Add hospital context middleware
MIDDLEWARE = [
    # ... other middleware
    'langchain_ai.middleware.HospitalContextMiddleware',
]
```

## Migration Guide

### From Non-Hospital-Aware to Hospital-Aware

1. **Update MCP Client Calls:**

   ```python
   # Old way
   async with get_mcp_client() as client:
       response = await client.call_tool("list_doctors", {"hospital_id": "1"})

   # New way
   async with get_mcp_client(user=request.user) as client:
       response = await client.call_tool("list_doctors", {})
   ```

2. **Update View Functions:**

   ```python
   # Old way
   result = asyncio.run(_process_simple_query_async(query, query_type, context))

   # New way
   result = asyncio.run(_process_simple_query_async(query, query_type, context, request.user))
   ```

3. **Use Hospital-Aware Tools:**
   ```python
   # New way with automatic hospital filtering
   tools = get_hospital_aware_tools(user)
   doctors = tools.list_doctors_with_context()
   ```

## Troubleshooting

### Common Issues

1. **No Hospital Context Available**

   - Ensure user has a hospital assigned
   - Check user.hospital relationship
   - Verify hospital is active

2. **MCP Tools Not Filtering by Hospital**

   - Ensure user context is passed to MCP client
   - Check hospital_id is being injected
   - Verify tool parameters

3. **Cross-Hospital Data Access**
   - Check hospital context validation
   - Ensure proper user authentication
   - Verify database queries are filtered

### Debug Mode

Enable debug logging to see hospital context:

```python
import logging
logging.getLogger('langchain_ai').setLevel(logging.DEBUG)
```

## Performance Considerations

- Hospital context is cached per request
- Database queries are optimized with proper filtering
- MCP client connections are reused when possible
- Async operations prevent blocking

## Future Enhancements

- [ ] Hospital-specific MCP tool permissions
- [ ] Advanced hospital context caching
- [ ] Hospital-specific prompt templates
- [ ] Multi-hospital user support
- [ ] Hospital context in MCP resources

## Support

For issues or questions about hospital-aware MCP implementation:

1. Check the test suite: `python test_hospital_aware_mcp.py`
2. Review the logs for hospital context information
3. Verify user has proper hospital assignment
4. Ensure MCP server is running and accessible

---

**Note:** This implementation ensures that all MCP tools, resources, and prompts automatically respect hospital boundaries, providing secure multi-tenant data isolation for the MedCor healthcare platform.
