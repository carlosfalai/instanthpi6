# 📝 Change Log - InstantHPI6

## Version 2.0.0 - January 21, 2025

### 🚀 Major Updates
- **AI Integration**: Replaced Ollama with OpenAI + Claude APIs
- **User Management**: Added doctor API key management
- **Model Selection**: Added ability to choose AI models
- **Enhanced Security**: Improved API key storage and testing

### ✅ Features Added
1. **OpenAI API Integration**
   - Doctor can use their own OpenAI API keys
   - Support for GPT-4, GPT-4o, GPT-3.5-turbo models
   - Automatic fallback system

2. **Claude API Integration**
   - Doctor can use their own Claude API keys
   - Support for Claude 3 Sonnet, Opus, Haiku models
   - Priority system (Claude first, then OpenAI)

3. **AI Settings Dashboard**
   - New "Paramètres IA" tab in dashboard
   - API key configuration interface
   - Model selection dropdowns
   - API key testing functionality

4. **Enhanced Medical Reports**
   - AI-powered report generation using doctor's preferred models
   - Improved HTML report templates
   - Better medical documentation structure

5. **Database Schema Updates**
   - Added `openai_api_key` column to users table
   - Added `claude_api_key` column to users table
   - Added `preferred_ai_model` column to users table
   - Added `preferred_claude_model` column to users table

### 🔧 Technical Changes
- **Dependencies**: Added `openai` and `@anthropic-ai/sdk` packages
- **API Routes**: Added `/api/doctor/settings` endpoints
- **Database**: Updated schema for API key storage
- **Security**: Enhanced API key validation and testing

### 🐛 Bug Fixes
- Fixed AI report generation to use doctor's API keys
- Improved error handling for API failures
- Enhanced fallback system when APIs are unavailable

### 📊 Performance Improvements
- Faster AI response times with proper API integration
- Better error handling and user feedback
- Improved dashboard loading times

## Version 1.0.0 - Previous (Ollama-based)
- Basic medical form system
- Ollama integration for AI reports
- Simple patient management
- Basic dashboard

---

## 🔄 Migration Notes
- **From Ollama to OpenAI/Claude**: Complete migration completed
- **API Key Management**: New system for doctor to manage their own keys
- **Model Selection**: Doctor can now choose preferred AI models
- **Enhanced Features**: All medical practice management features retained

## 📋 Next Version Planning
- Advanced AI model options
- Bulk operations
- Enhanced analytics
- Mobile optimization
- Advanced reporting features

---
**Last Updated**: January 21, 2025
**Status**: Production Ready
**Location**: `/Users/carlosfavielfont/instanthpi-ollama/`
