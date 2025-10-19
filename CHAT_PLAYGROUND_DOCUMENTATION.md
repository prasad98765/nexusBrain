# Chat Playground - External Testing Interface

## Overview
The Chat Playground is a comprehensive ChatGPT-like interface that allows users to test their Nexus AI Hub API end-to-end with a professional, user-friendly UI. This external link can be shared and opened independently for testing bot functionality.

## Features Implemented

### 1. **External Link Generation** ✅
- **Location**: API Integrations page
- **Button**: "Copy External Link" 
- **Functionality**: Generates a shareable link with embedded API token
- **Format**: `https://nexusaihub.co.in/chat-playground?token=YOUR_API_TOKEN`

#### Usage:
1. Navigate to **API Integrations** page
2. Click **"Copy External Link"** button
3. Share or open the link in any browser
4. The interface will authenticate automatically using the token in the URL

### 2. **ChatGPT-Like UI** ✅

#### Main Features:
- **Clean, Modern Interface**: Dark theme matching ChatGPT's aesthetic
- **Message Bubbles**: Distinct styling for user and assistant messages
- **Real-time Streaming**: Live text generation with streaming responses
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Smooth Animations**: Professional transitions and interactions

#### Layout:
```
┌─────────────────────────────────────────────────────────┐
│  [Sidebar]  │  [Main Chat Area]                         │
│             │  ┌─────────────────────────────────────┐  │
│  • New Chat │  │  Messages                           │  │
│  • Settings │  │  • User message bubbles (right)     │  │
│  • Recents  │  │  • Assistant responses (left)       │  │
│             │  │  • Action buttons on hover          │  │
│             │  └─────────────────────────────────────┘  │
│             │  [Input Area with Send Button]            │
└─────────────────────────────────────────────────────────┘
```

### 3. **Streaming Responses** ✅

The playground supports real-time streaming responses:

```typescript
// Streaming is enabled by default
stream: true

// Real-time text generation
// Characters appear one by one as they're generated
// Loading indicator shows during streaming
```

**Features**:
- ✅ Character-by-character display
- ✅ Loading indicator during streaming
- ✅ Stop button to cancel ongoing requests
- ✅ Automatic scrolling to latest message

### 4. **Message Actions** ✅

Every message supports multiple actions (appears on hover):

#### For User Messages:
- **Copy** 📋: Copy message to clipboard
- **Edit** ✏️: Edit and resubmit the message

#### For Assistant Messages:
- **Copy** 📋: Copy response to clipboard
- **Retry** 🔄: Regenerate the response
- **Try Again**: Request a new answer to the same question

#### Edit & Resubmit Workflow:
```
1. User hovers over their message → Edit button appears
2. Click Edit → Message becomes editable textarea
3. Modify the text
4. Click "Save & Submit" → Message updates and conversation continues from that point
5. Previous responses after the edited message are removed
6. New response is generated based on the edited message
```

### 5. **Text Selection Feature** ✅

Users can select any text in the conversation and ask questions about it:

**How it works**:
1. Select any text in the chat
2. The selection is captured automatically
3. Input field auto-populates with: `"Explain the following: [selected text]"`
4. User can modify or send directly
5. Selected text badge appears above input (can be dismissed)

**Use Cases**:
- Explain a specific code snippet
- Get more details about a particular sentence
- Clarify terminology
- Deep dive into any part of the response

### 6. **Left Sidebar Configuration Panel** ✅

#### Model Configuration Options:

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

#### Configurable Parameters:

1. **Model Selection**
   - Dropdown with all available models from `/api/v1/models`
   - Live model switching
   - Models cached for 10 minutes

2. **Max Tokens** (50 - 4000)
   - Slider control
   - Default: 150
   - Real-time value display

3. **Temperature** (0.0 - 2.0)
   - Slider control
   - Default: 0.7
   - Controls response creativity

4. **Cache Threshold** (0.0 - 1.0)
   - Slider control
   - Default: 0.5
   - Semantic similarity threshold

5. **Stream Toggle**
   - Enable/disable streaming
   - Default: ON

6. **Use Cache Toggle**
   - Enable/disable response caching
   - Default: OFF

7. **Live Configuration Display**
   - JSON preview of current settings
   - Updates in real-time

#### Access:
- **Desktop**: Left sidebar always visible
- **Mobile**: Settings button in top bar opens sheet

### 7. **Responsive Design** ✅

#### Desktop (1024px+):
- Permanent left sidebar
- Wide chat area
- Full configuration panel

#### Tablet (768px - 1023px):
- Collapsible sidebar
- Optimized message width
- Touch-friendly controls

#### Mobile (< 768px):
- Top navigation bar
- Full-width messages
- Bottom sheet for settings
- Mobile-optimized input

#### Key Responsive Features:
- Flexible grid layouts
- Touch-friendly button sizes
- Optimized typography
- Adaptive message widths
- Smooth transitions between breakpoints

### 8. **API Integration** ✅

#### Endpoint:
```bash
POST https://nexusaihub.co.in/api/v1/chat/create
```

#### Request Format:
```json
{
  "model": "openai/gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful AI assistant."
    },
    {
      "role": "user",
      "content": "What is the meaning of dinner?"
    }
  ],
  "max_tokens": 150,
  "temperature": 0.7,
  "stream": true,
  "cache_threshold": 0.5,
  "is_cached": false
}
```

#### Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

#### Response Handling:
- **Streaming**: Server-Sent Events (SSE) format
- **Non-streaming**: Standard JSON response
- **Error handling**: User-friendly error messages
- **Abort support**: Stop ongoing requests

## User Workflows

### Workflow 1: Basic Chat
```
1. Open external link
2. Type message in input field
3. Press Enter or click Send
4. Watch response stream in real-time
5. Continue conversation
```

### Workflow 2: Edit & Retry
```
1. Have a conversation
2. Hover over a user message
3. Click Edit button
4. Modify the message
5. Click "Save & Submit"
6. Conversation continues from edited point
```

### Workflow 3: Configuration Change
```
1. Open Settings (sidebar or mobile button)
2. Select different model
3. Adjust temperature/tokens
4. Continue chatting with new settings
5. See changes reflected in responses
```

### Workflow 4: Text Selection
```
1. Receive a response
2. Select specific text
3. Input auto-fills with selection
4. Ask follow-up question
5. Get targeted answer
```

## Technical Implementation

### Technologies Used:
- **React**: UI framework
- **TypeScript**: Type safety
- **React Query**: Data fetching and caching
- **Tailwind CSS**: Styling
- **Shadcn UI**: Component library
- **React Markdown**: Message rendering
- **Fetch API**: Streaming support

### Key Components:

1. **ChatPlayground** (Main Component)
   - Message management
   - API integration
   - State management

2. **Message Component**
   - Markdown rendering
   - Action buttons
   - Edit mode

3. **Settings Sheet**
   - Configuration panel
   - Model selection
   - Parameter adjustments

4. **Input Area**
   - Text input
   - Send/Stop controls
   - Selection display

### State Management:
```typescript
- messages: Message[]        // Chat history
- config: ModelConfig        // API parameters
- isLoading: boolean         // Loading state
- selectedText: string       // Selected text
- editingMessageId: string   // Currently editing
```

### Caching Strategy:
- Models list cached for 10 minutes
- No chat history persistence (by design)
- Configuration persists in component state

## Security Considerations

1. **Token in URL**: 
   - ⚠️ Token is visible in URL
   - Should not be shared publicly
   - Consider session-based auth for production

2. **CORS**: 
   - Ensure API allows requests from playground domain

3. **Rate Limiting**:
   - API should have rate limiting
   - Prevent abuse of external links

## Future Enhancements

### Planned Features:

1. **Chat History** 💾
   - Save conversation threads
   - Browse past chats
   - Export conversations

2. **Conversation Management** 📁
   - Label conversations
   - Archive old chats
   - Search chat history

3. **Export Options** 📤
   - Download as Markdown
   - Copy entire conversation
   - Share conversation link

4. **Advanced Features** 🚀
   - Image support
   - File attachments
   - Voice input
   - Code syntax highlighting

5. **Analytics** 📊
   - Token usage tracking
   - Response time metrics
   - Model performance comparison

6. **Collaboration** 👥
   - Share conversations
   - Multi-user testing
   - Team workspaces

## Testing Guide

### Manual Testing Checklist:

#### Basic Functionality:
- [ ] External link copies successfully
- [ ] Link opens playground with valid token
- [ ] Messages send and receive correctly
- [ ] Streaming works properly
- [ ] Stop button cancels requests

#### Message Actions:
- [ ] Copy button works for all messages
- [ ] Edit button opens edit mode
- [ ] Save & Submit updates conversation
- [ ] Retry regenerates response
- [ ] Cancel edit reverts changes

#### Configuration:
- [ ] Model dropdown shows all models
- [ ] Sliders adjust values correctly
- [ ] Toggles change settings
- [ ] Settings persist during session
- [ ] JSON display updates in real-time

#### Responsive Design:
- [ ] Desktop layout displays correctly
- [ ] Mobile view is fully functional
- [ ] Settings sheet works on mobile
- [ ] Touch interactions work smoothly
- [ ] All breakpoints tested

#### Text Selection:
- [ ] Text selection captures correctly
- [ ] Input auto-fills with selection
- [ ] Selection badge appears
- [ ] Badge can be dismissed
- [ ] Works across all messages

## Troubleshooting

### Common Issues:

1. **"Invalid Access" Error**
   - Ensure token is in URL
   - Check token validity
   - Verify API token exists

2. **Streaming Not Working**
   - Check stream toggle is ON
   - Verify API supports streaming
   - Check network connectivity

3. **Models Not Loading**
   - Verify token has permissions
   - Check API endpoint is accessible
   - Clear cache and refresh

4. **Mobile Layout Issues**
   - Clear browser cache
   - Update to latest version
   - Check viewport settings

## API Reference

### Endpoints Used:

1. **GET /api/v1/models**
   - Fetches available models
   - Requires: Bearer token
   - Returns: Model list

2. **POST /api/v1/chat/create**
   - Creates chat completion
   - Requires: Bearer token
   - Supports: Streaming

### Error Codes:

- `401`: Unauthorized (invalid token)
- `429`: Rate limit exceeded
- `500`: Server error
- `503`: Service unavailable

## Performance Metrics

### Target Performance:
- **Time to Interactive**: < 2s
- **First Response**: < 1s
- **Streaming Latency**: < 100ms
- **Model Load Time**: < 500ms (cached)

### Optimization:
- React Query caching for models
- Lazy loading for messages
- Virtual scrolling (future)
- Image optimization (future)

## Accessibility

### Features:
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ High contrast mode compatible
- ✅ Focus indicators
- ✅ ARIA labels

### Keyboard Shortcuts:
- `Enter`: Send message
- `Shift + Enter`: New line
- `Esc`: Close settings/cancel edit

## Deployment Notes

### Environment Variables:
```bash
VITE_API_BASE_URL=https://nexusaihub.co.in
```

### Build Command:
```bash
npm run build
```

### Route Configuration:
- Path: `/chat-playground`
- Public access: Yes (with token)
- Auth required: Token in URL

## Support & Maintenance

### Monitoring:
- Check error logs regularly
- Monitor API response times
- Track user feedback

### Updates:
- Keep dependencies updated
- Test new model releases
- Improve based on user feedback

---

## Quick Start for Users

1. **Get Your Link**:
   - Go to API Integrations page
   - Click "Copy External Link"
   - Link copied to clipboard!

2. **Open & Test**:
   - Paste link in browser
   - Start chatting immediately
   - No additional setup needed

3. **Customize**:
   - Open Settings
   - Choose your model
   - Adjust parameters
   - Test different configurations

4. **Share** (Optional):
   - Share link with team
   - Test bot collaboratively
   - Gather feedback

---

**Last Updated**: 2025-10-18  
**Version**: 1.0.0  
**Maintainer**: Nexus AI Hub Team
