# Chat Playground - Quick Reference Guide

## 🚀 Quick Start

### For Users:
1. Navigate to **API Integrations** page
2. Click **"Copy External Link"** button
3. Open the link in any browser
4. Start chatting immediately!

### Link Format:
```
https://nexusaihub.co.in/chat-playground?token=YOUR_API_TOKEN
```

---

## 🎯 Key Features

### ✅ ChatGPT-Style Interface
- Real-time streaming responses
- Clean, modern dark theme
- Fully responsive (mobile to desktop)
- Smooth animations and transitions

### ✅ Message Actions
| Action | User Messages | Assistant Messages |
|--------|---------------|-------------------|
| **Copy** | ✅ | ✅ |
| **Edit** | ✅ | ❌ |
| **Retry** | ❌ | ✅ |

### ✅ Text Selection
- Select any text → Auto-fill input
- Ask questions about specific parts
- Perfect for clarifications

### ✅ Live Configuration
```json
{
  "model": "openai/gpt-4o-mini",
  "max_tokens": 150,
  "temperature": 0.7,
  "stream": true,
  "cache_threshold": 0.5,
  "is_cached": false
}
```

---

## 📱 Interface Layout

### Desktop View:
```
┌──────────────┬──────────────────────────────┐
│   Sidebar    │      Chat Area               │
│              │                              │
│ • New Chat   │  [Messages]                  │
│ • Settings   │  • User (right)              │
│ • History    │  • Bot (left)                │
│              │                              │
│              │  [Input + Send]              │
└──────────────┴──────────────────────────────┘
```

### Mobile View:
```
┌─────────────────────────────────┐
│  [Top Bar: Logo + Menu]         │
├─────────────────────────────────┤
│                                 │
│      [Messages Area]            │
│                                 │
├─────────────────────────────────┤
│  [Input + Send Button]          │
└─────────────────────────────────┘
```

---

## ⚙️ Configuration Panel

### Access:
- **Desktop**: Always visible on left
- **Mobile**: Tap Settings icon

### Parameters:

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| **Model** | Dropdown | gpt-4o-mini | AI model selection |
| **Max Tokens** | 50-4000 | 150 | Response length |
| **Temperature** | 0.0-2.0 | 0.7 | Creativity level |
| **Cache Threshold** | 0.0-1.0 | 0.5 | Similarity threshold |
| **Stream** | ON/OFF | ON | Real-time responses |
| **Use Cache** | ON/OFF | OFF | Enable caching |

---

## 🎬 Common Workflows

### 1. Basic Chat
```
Type message → Press Enter → See response
```

### 2. Edit & Retry
```
Hover message → Click Edit → Modify → Save & Submit
```

### 3. Select & Ask
```
Select text → Input auto-fills → Send → Get answer
```

### 4. Change Model
```
Open Settings → Choose model → Continue chatting
```

### 5. Stop Generation
```
While streaming → Click Stop button → Request cancelled
```

---

## 🔑 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line |
| `Esc` | Close settings/Cancel edit |

---

## 💡 Pro Tips

### 1. **Faster Responses**
- Reduce max_tokens for quicker replies
- Enable caching for repeated questions

### 2. **Better Quality**
- Increase temperature for creativity
- Use higher-tier models for complex tasks

### 3. **Cost Optimization**
- Enable caching for similar queries
- Use appropriate max_tokens
- Choose efficient models

### 4. **Testing Different Scenarios**
- Use Edit to test variations
- Try different models for comparison
- Adjust temperature for tone

---

## 🐛 Troubleshooting

### Issue: "Invalid Access"
**Solution**: Ensure token is in URL. Copy fresh link from API Integrations.

### Issue: No streaming
**Solution**: Check "Stream" toggle is ON in settings.

### Issue: Models not loading
**Solution**: Refresh page. Verify token is valid.

### Issue: Response errors
**Solution**: Check model selection. Verify API status.

---

## 📊 API Integration

### Request Example:
```bash
curl --location 'https://nexusaihub.co.in/api/v1/chat/create' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data '{
  "model": "openai/gpt-4o-mini",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "max_tokens": 150,
  "temperature": 0.7,
  "stream": true
}'
```

### Response Format (Streaming):
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" there"}}]}
data: [DONE]
```

---

## 🔒 Security Notes

⚠️ **Important**:
- Token is visible in URL
- Don't share links publicly
- Regenerate token if compromised
- Use HTTPS only

---

## 📈 Coming Soon

- 💾 Chat history persistence
- 📁 Conversation management
- 📤 Export to Markdown/PDF
- 🎨 Custom themes
- 🔊 Voice input
- 📊 Usage analytics

---

## 📞 Support

### Need Help?
- Check full documentation: `CHAT_PLAYGROUND_DOCUMENTATION.md`
- API Reference: `/docs/api-reference`
- Contact: support@nexusaihub.co.in

---

## ✨ Feature Highlights

### What Makes It Special:

1. **No Setup Required**: Just click and chat
2. **Real-time Streaming**: Like ChatGPT
3. **Full Control**: Adjust all parameters
4. **Mobile-Friendly**: Works everywhere
5. **Professional UI**: Clean and intuitive

### Perfect For:

- ✅ API testing
- ✅ Bot demonstration
- ✅ Team collaboration
- ✅ Client presentations
- ✅ Development testing

---

## 🎯 Best Practices

### 1. Regular Testing
- Test after API changes
- Verify different models
- Check edge cases

### 2. Configuration Management
- Save successful configs
- Document model performance
- Track token usage

### 3. User Experience
- Keep responses concise
- Use appropriate models
- Enable streaming for better UX

### 4. Security
- Rotate tokens regularly
- Monitor usage logs
- Limit link sharing

---

**Quick Access**: [API Integrations](/nexus/API-integrations) → Copy External Link

**Version**: 1.0.0  
**Last Updated**: 2025-10-18
