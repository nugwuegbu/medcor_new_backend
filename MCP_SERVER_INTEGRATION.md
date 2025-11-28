# MCP Server Integration with Intelligent Query Processing

## Overview

The LangChain AI service now features **full MCP (Model Context Protocol) server integration** for the Intelligent Query Processing endpoint. This integration enables the system to use MCP tools, resources, and prompts to handle different types of queries intelligently.

## Architecture

```
User Query → Intelligent Query Processing → MCP Server → Appropriate Tool
     ↓                    ↓                    ↓              ↓
  Auto-detect      Query Type Detection    Tool Selection   Execution
  Query Type       (AI/Database/Medical)   (MCP Tools)     (Results)
```

## MCP Server Integration Features

### 🧠 **Intelligent Tool Selection**

The system automatically selects the appropriate MCP tool based on query content:

- **`medical_analysis`** - For clinical questions, symptoms, diagnosis, treatments
- **`database_query`** - For data retrieval, patient records, appointments, statistics
- **`ai_analysis`** - For general knowledge, explanations, educational content

### 🔧 **MCP Tools Used**

#### Medical Analysis Tool

```json
{
  "tool": "medical_analysis",
  "parameters": {
    "medical_data": "Patient presents with chest pain",
    "analysis_type": "symptoms_diagnosis",
    "use_medical_knowledge": true,
    "use_clinical_guidelines": true,
    "model": "gpt-4",
    "temperature": 0.3
  }
}
```

#### Database Query Tool

```json
{
  "tool": "database_query",
  "parameters": {
    "query": "Show me all patients with diabetes",
    "database": "medical_records",
    "context": "medical_records",
    "use_sql_generation": true,
    "max_results": 100
  }
}
```

#### AI Analysis Tool

```json
{
  "tool": "ai_analysis",
  "parameters": {
    "query": "What is machine learning?",
    "query_type": "general",
    "context": {},
    "use_prompts": true,
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

## API Endpoints

### `POST /api/ai/query/` - Intelligent Query Processing with MCP

**Description**: Single endpoint that automatically processes any type of query using MCP server tools.

**Request Body**:

```json
{
  "query": "What are the symptoms of diabetes?",
  "query_type": "auto",
  "use_celery": false,
  "database": "default"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Query processed using medical_analysis via MCP server",
  "result": "Medical Analysis: Based on the symptoms...",
  "query_type_detected": "medical",
  "tool_used": "medical_analysis",
  "processing_time": 1.2,
  "confidence": 0.85,
  "mcp_available": true
}
```

## Query Type Detection

### Medical Query Indicators

- **Keywords**: "symptoms", "diagnosis", "treatment", "medicine", "drug", "therapy"
- **Context**: "patient presents", "medical condition", "disease", "illness"
- **Clinical**: "clinical", "pathology", "prognosis", "etiology", "complications"

### Database Query Indicators

- **Keywords**: "show me", "list", "find", "get", "select", "retrieve"
- **Data**: "patients with", "appointments", "records", "data", "table"
- **Time**: "all patients", "today's", "this week", "statistics"

### AI Query Indicators

- **Questions**: "what is", "how to", "explain", "describe", "tell me about"
- **Interrogatives**: "why", "when", "where", "who", "which", "can you"
- **Educational**: "help me understand", "difference between", "compare"

## Processing Modes

### Real-time Processing (Default)

- **Use**: `"use_celery": false`
- **Response**: Immediate results via MCP server
- **Best for**: Simple queries, quick responses

### Background Processing

- **Use**: `"use_celery": true`
- **Response**: Task ID for status tracking
- **Best for**: Complex queries, long-running operations

## MCP Server Configuration

### Settings

```python
# In settings.py
MCP_SERVER_URL = "http://localhost:8001"  # MCP server URL
MCP_SERVER_TIMEOUT = 30  # Request timeout in seconds
```

### Health Check

The system continuously monitors MCP server availability:

- **Health endpoint**: `GET /api/ai/health/`
- **MCP status**: Included in health response
- **Fallback**: Graceful degradation when MCP unavailable

## Error Handling

### MCP Server Unavailable

```json
{
  "success": false,
  "error": "MCP server is not available",
  "result": "Unable to process query - MCP server connection failed",
  "mcp_available": false
}
```

### Tool Execution Failure

```json
{
  "success": false,
  "error": "MCP medical analysis failed",
  "result": "Medical analysis failed: Connection timeout",
  "mcp_available": true
}
```

## Usage Examples

### Example 1: Medical Query

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "What are the symptoms of diabetes?"}'
```

**MCP Tool Used**: `medical_analysis`
**Result**: Clinical analysis with medical knowledge and guidelines

### Example 2: Database Query

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "Show me all patients with diabetes"}'
```

**MCP Tool Used**: `database_query`
**Result**: SQL generation and data retrieval from medical records

### Example 3: AI Query

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "What is machine learning?"}'
```

**MCP Tool Used**: `ai_analysis`
**Result**: AI-powered explanation with custom prompts

### Example 4: Background Processing

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "Analyze all patient records for diabetes trends",
    "use_celery": true
  }'
```

**Result**: Task submitted for background processing via Celery + MCP

## Monitoring and Debugging

### Health Check

```bash
curl http://localhost:8000/api/ai/health/
```

### Task Status

```bash
curl http://localhost:8000/api/ai/task/{task_id}/status/
```

### MCP Server Logs

Monitor MCP server logs for tool execution details and performance metrics.

## Benefits

### 🚀 **Enhanced Capabilities**

- **MCP Tools**: Access to specialized medical, database, and AI tools
- **Resource Management**: Efficient use of MCP server resources
- **Prompt Engineering**: Custom prompts for different query types

### 🎯 **Improved Accuracy**

- **Medical Analysis**: Clinical guidelines and medical knowledge
- **Database Queries**: SQL generation and optimization
- **AI Responses**: Context-aware explanations and analysis

### ⚡ **Better Performance**

- **Tool Selection**: Automatic selection of optimal tools
- **Caching**: Results cached for improved response times
- **Background Processing**: Long-running operations don't block API

### 🔧 **Developer Experience**

- **Single Endpoint**: One API for all query types
- **Comprehensive Documentation**: OpenAPI/Swagger integration
- **Error Handling**: Detailed error messages and status codes

## Future Enhancements

- **Custom MCP Tools**: User-defined tools for specific use cases
- **Tool Chaining**: Multi-tool workflows for complex queries
- **Performance Optimization**: Caching and optimization strategies
- **Analytics**: Query pattern analysis and tool usage metrics
- **Custom Prompts**: User-configurable prompts for different domains

---

Visit the [Swagger Documentation](http://localhost:8000/api/docs/) for interactive API testing and complete schema details.
