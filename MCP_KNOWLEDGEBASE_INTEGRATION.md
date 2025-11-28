# MCP Knowledgebase Integration Guide

## Overview

The MedCor MCP Server now includes comprehensive knowledgebase management tools that allow programmatic access to AI identity configurations, behavior settings, response templates, and source files for each hospital. The AI identity system prompt serves as the base template for generating complete system prompts for each hospital's AI assistant.

## 🚀 Key Features

### ✅ **AI Identity Management**

- **System Prompt Templates**: Each hospital has a customizable AI identity with a base system prompt
- **Agent Configuration**: Set agent name, title, and personality
- **Template-Based Generation**: Use AI identity as the foundation for complete system prompts

### ✅ **Behavior Configuration**

- **Communication Settings**: Tone, style, confidence level, response length
- **Feature Toggles**: Follow-up questions, appointment booking, personalization
- **Hospital-Specific**: Each hospital can have unique AI behavior

### ✅ **Response Templates**

- **Predefined Responses**: Greeting, appointment booking, emergency, fallback
- **Contextual Templates**: Business hours, medical specialties
- **Consistent Messaging**: Standardized responses across the hospital

### ✅ **Source File Management**

- **Knowledge Base Files**: Upload and manage source documents
- **File Metadata**: Track file names, sizes, types, and URLs
- **Hospital Isolation**: Each hospital has its own source files

## 🛠️ Available MCP Tools

### 1. **AI Identity Tools**

#### `get_ai_identity(hospital_id: str)`

Get AI identity configuration including system prompt template.

**Response:**

```json
{
  "success": true,
  "hospital_id": "uuid",
  "hospital_name": "Hospital Name",
  "agent_name": "Medcor AI",
  "agent_title": "Medical Assistant",
  "system_prompt": "Base system prompt template...",
  "is_active": true
}
```

#### `create_or_update_ai_identity(hospital_id: str, agent_name: str, agent_title: str, system_prompt: str, is_active: bool = True)`

Create or update AI identity configuration for a hospital.

### 2. **Behavior Configuration Tools**

#### `get_behavior_config(hospital_id: str)`

Get AI behavior configuration for a hospital.

**Response:**

```json
{
  "success": true,
  "hospital_id": "uuid",
  "hospital_name": "Hospital Name",
  "communication_tone": "Empathic",
  "communication_style": "Conversational",
  "confidence_level": "Conservative",
  "response_length": "Short",
  "enable_follow_up_questions": true,
  "enable_appointment_booking": true,
  "enable_personalization": true
}
```

#### `create_or_update_behavior_config(hospital_id: str, communication_tone: str = "Professional", ...)`

Create or update AI behavior configuration.

### 3. **Response Template Tools**

#### `get_response_templates(hospital_id: str)`

Get AI response templates for a hospital.

**Response:**

```json
{
  "success": true,
  "hospital_id": "uuid",
  "hospital_name": "Hospital Name",
  "greeting_message": "Welcome to our hospital...",
  "appointment_booking": "To book an appointment...",
  "general_inquiries": "For general questions...",
  "fallback_response": "I'm not sure about that...",
  "emergency_response": "For emergencies...",
  "business_hours": "Our hours are...",
  "medical_specialties": "We offer..."
}
```

#### `create_or_update_response_templates(hospital_id: str, greeting_message: str, ...)`

Create or update AI response templates.

### 4. **Source File Management Tools**

#### `get_knowledgebase_sources(hospital_id: str)`

Get knowledgebase source files for a hospital.

**Response:**

```json
{
  "success": true,
  "hospital_id": "uuid",
  "hospital_name": "Hospital Name",
  "files_count": 2,
  "files": [
    {
      "id": "uuid",
      "file_name": "hospital_policies.pdf",
      "file_size": 1024000,
      "file_type": "pdf",
      "file_url": "/media/knowledgebase/sources/2025/01/15/hospital_policies.pdf",
      "is_active": true
    }
  ]
}
```

#### `create_knowledgebase_source(hospital_id: str)`

Create a knowledgebase source container for a hospital.

### 5. **Comprehensive Tools**

#### `get_complete_knowledgebase(hospital_id: str)`

Get complete knowledgebase configuration including all components.

**Response:**

```json
{
  "success": true,
  "hospital_id": "uuid",
  "hospital_name": "Hospital Name",
  "ai_identity": {
    "agent_name": "Medcor AI",
    "agent_title": "Medical Assistant",
    "system_prompt": "Base template...",
    "is_active": true
  },
  "behavior": {
    "communication_tone": "Empathic",
    "communication_style": "Conversational",
    "confidence_level": "Conservative",
    "response_length": "Short",
    "enable_follow_up_questions": true,
    "enable_appointment_booking": true,
    "enable_personalization": true
  },
  "response_templates": {
    "greeting_message": "Welcome...",
    "appointment_booking": "To book...",
    "general_inquiries": "For questions...",
    "fallback_response": "I'm not sure...",
    "emergency_response": "For emergencies...",
    "business_hours": "Our hours...",
    "medical_specialties": "We offer..."
  },
  "source_files": {
    "files_count": 2,
    "files": [...],
    "is_active": true
  }
}
```

### 6. **System Prompt Generation**

#### `generate_system_prompt_from_template(hospital_id: str, additional_context: Optional[str] = None)`

Generate a complete system prompt using the hospital's AI identity template and current configuration.

**Response:**

```json
{
  "success": true,
  "hospital_id": "uuid",
  "hospital_name": "Hospital Name",
  "agent_name": "Medcor AI",
  "agent_title": "Medical Assistant",
  "generated_system_prompt": "You are Medcor AI, Medical Assistant for Emirates Hospital Jumeirah.\n\n[Base template]\n\n[Hospital info]\n\n[Behavior config]\n\n[Response templates]\n\n[Additional context]",
  "base_template": "Base system prompt template...",
  "includes_behavior": true,
  "includes_responses": true,
  "includes_additional_context": false
}
```

## 🎯 System Prompt Template Architecture

### **Base Template (AI Identity)**

The AI identity `system_prompt` field serves as the foundational template that defines:

- Core AI personality and role
- Basic operational guidelines
- Medical ethics and standards
- Primary responsibilities

### **Dynamic Context Integration**

The system prompt generator automatically includes:

1. **Hospital Information**

   - Hospital name, type, address
   - Contact information
   - Location details

2. **Behavior Configuration**

   - Communication tone and style
   - Confidence level and response length
   - Feature enablement (follow-ups, booking, personalization)

3. **Response Templates**

   - Predefined responses for common scenarios
   - Emergency and fallback responses
   - Business hours and specialty information

4. **Additional Context** (Optional)
   - Custom context for specific use cases
   - Session-specific information
   - Dynamic requirements

### **Generated Prompt Structure**

```
You are [Agent Name], [Agent Title] for [Hospital Name].

[Base AI Identity Template]

HOSPITAL INFORMATION:
- Name: [Hospital Name]
- Type: [Hospital Type]
- Address: [Full Address]
- Phone: [Phone Number]
- Email: [Email]

BEHAVIOR CONFIGURATION:
- Communication Tone: [Tone]
- Communication Style: [Style]
- Confidence Level: [Level]
- Response Length: [Length]
- Follow-up Questions: [Enabled/Disabled]
- Appointment Booking: [Enabled/Disabled]
- Personalization: [Enabled/Disabled]

RESPONSE TEMPLATES:
- Greeting: [Greeting Message]
- Appointment Booking: [Booking Template]
- General Inquiries: [Inquiry Template]
- Emergency Response: [Emergency Template]
- Business Hours: [Hours Information]
- Medical Specialties: [Specialties Information]

[Additional Context if provided]

Remember to maintain consistency with your configured behavior and use the appropriate response templates when relevant.
```

## 📋 Usage Examples

### **Example 1: Get Complete Knowledgebase**

```python
# Get all knowledgebase components for a hospital
result = get_complete_knowledgebase("fcdf00c9-3c8e-47de-9a93-62212f87d93e")

if result["success"]:
    ai_identity = result["ai_identity"]
    behavior = result["behavior"]
    responses = result["response_templates"]
    sources = result["source_files"]

    print(f"Hospital: {result['hospital_name']}")
    print(f"AI Agent: {ai_identity['agent_name']} - {ai_identity['agent_title']}")
    print(f"Communication Style: {behavior['communication_tone']} {behavior['communication_style']}")
    print(f"Source Files: {sources['files_count']} files")
```

### **Example 2: Generate System Prompt**

```python
# Generate complete system prompt for a hospital
additional_context = "Today is Monday. Focus on preventive care recommendations."

result = generate_system_prompt_from_template(
    hospital_id="fcdf00c9-3c8e-47de-9a93-62212f87d93e",
    additional_context=additional_context
)

if result["success"]:
    system_prompt = result["generated_system_prompt"]
    print("Generated System Prompt:")
    print(system_prompt)
```

### **Example 3: Update AI Identity**

```python
# Update AI identity with new system prompt template
result = create_or_update_ai_identity(
    hospital_id="fcdf00c9-3c8e-47de-9a93-62212f87d93e",
    agent_name="Sophie",
    agent_title="Senior Medical Assistant",
    system_prompt="You are Sophie, an advanced AI medical assistant specializing in patient care and medical guidance. Your role is to provide accurate, empathetic, and helpful medical information while maintaining the highest standards of patient safety and medical ethics.",
    is_active=True
)

if result["success"]:
    print(f"AI Identity {result['action']} successfully")
    print(f"Agent: {result['agent_name']} - {result['agent_title']}")
```

## 🔧 Integration with Existing Systems

### **Hospital-Aware MCP**

The knowledgebase tools integrate seamlessly with the existing hospital-aware MCP architecture:

- **Multi-tenant Support**: Each hospital has isolated knowledgebase configurations
- **Hospital Context**: All tools automatically include hospital information
- **Consistent API**: Follows the same patterns as other MCP tools

### **AI Assistant Integration**

The generated system prompts can be used with:

- **OpenAI GPT Models**: Direct integration with system prompts
- **Local LLMs**: Compatible with any LLM that accepts system prompts
- **Custom AI Systems**: Flexible template system for various AI implementations

### **REST API Compatibility**

The MCP tools complement the existing REST API endpoints:

- **Unified KnowledgeBase API**: `/api/knowledgebase/hospital/{hospital_id}/knowledge-base/`
- **Individual Component APIs**: Separate endpoints for each component
- **File Upload APIs**: Source file management endpoints

## 🚀 Getting Started

### **1. Start MCP Server**

```bash
python mcp_server.py
```

### **2. Test Knowledgebase Tools**

```python
# Test basic functionality
from mcp_client import MCPClient

client = MCPClient()
result = client.call_tool("get_complete_knowledgebase", {
    "hospital_id": "your-hospital-id"
})
```

### **3. Configure AI Identity**

```python
# Set up AI identity for a hospital
result = client.call_tool("create_or_update_ai_identity", {
    "hospital_id": "your-hospital-id",
    "agent_name": "Your AI Assistant",
    "agent_title": "Medical Assistant",
    "system_prompt": "Your base system prompt template here...",
    "is_active": True
})
```

### **4. Generate System Prompts**

```python
# Generate complete system prompt
result = client.call_tool("generate_system_prompt_from_template", {
    "hospital_id": "your-hospital-id",
    "additional_context": "Optional additional context"
})

if result["success"]:
    system_prompt = result["generated_system_prompt"]
    # Use with your AI system
```

## 📊 Current Status

### **✅ Implemented Features**

- [x] AI Identity management with system prompt templates
- [x] Behavior configuration management
- [x] Response template management
- [x] Source file management
- [x] Complete knowledgebase retrieval
- [x] System prompt generation from templates
- [x] Hospital-aware multi-tenant support
- [x] Comprehensive error handling
- [x] Integration testing completed

### **🎯 Ready for Production**

The MCP knowledgebase integration is fully functional and ready for production use. All tools have been tested with real hospital data and are working correctly.

### **📈 Benefits**

- **Centralized AI Configuration**: Manage all AI settings in one place
- **Template-Based System**: Consistent system prompt generation
- **Hospital Customization**: Each hospital can have unique AI personalities
- **Scalable Architecture**: Easy to add new features and components
- **MCP Integration**: Seamless integration with existing MCP tools
- **REST API Compatibility**: Works alongside existing REST endpoints

## 🔗 Related Documentation

- [MCP Server README](MCP_SERVER_README.md)
- [MCP Complete Documentation](MCP_COMPLETE_DOCUMENTATION.md)
- [Knowledgebase API Documentation](KNOWLEDGEBASE_API_DOCUMENTATION.md)
- [Unified Knowledgebase API](UNIFIED_KNOWLEDGEBASE_API_DOCUMENTATION.md)
- [Hospital-Aware MCP](HOSPITAL_AWARE_MCP_DOCUMENTATION.md)

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
