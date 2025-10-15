# AI ChatBot Component Documentation

## Overview

The **ChatBot** component is an interactive AI assistant integrated into the landing page. It provides real-time streaming responses from the Nexus AI Hub API without maintaining session history across reopens.

---

## 🎯 Features

### Core Functionality
- ✨ **Floating Bot Button** - Fixed bottom-right corner with animated pulse ring
- 💬 **Chat Window Modal** - Responsive modal/panel for all screen sizes
- 🔄 **Session Management** - No session persistence; fresh start every time
- ⚡ **Streaming Responses** - Real-time text streaming with typing animation
- 🎨 **Dark Theme** - AI aesthetic with neon gradients and shadowed bubbles
- 📱 **Fully Responsive** - Works seamlessly on mobile, tablet, and desktop

---

## 🚀 User Flow

### 1. **Bot Launch**
```
User clicks floating bot icon (bottom-right)
↓
Chat window opens with initial message:
"This bot does not maintain any session. 
If you start again, it will be treated as a new session."
↓
[Start Conversation] button displayed
```

### 2. **Starting Conversation**
```
User clicks "Start Conversation"
↓
Bot displays welcome message:
"💬 Welcome to Nexus AI Hub! What can we help you with today?"
↓
Input field becomes active
```

### 3. **Conversation Flow**
```
User types message → presses Enter or clicks Send
↓
User message appears (purple/pink gradient bubble)
↓
Loading indicator (3 animated dots)
↓
Bot response streams in real-time (character by character)
↓
Cursor blinks during streaming
↓
Response complete
```

### 4. **Closing & Reopening**
```
User clicks X button
↓
Chat window closes with smooth animation
↓
All messages cleared
↓
User reopens → Fresh session starts
↓
Initial message + Start button shown again
```

---

## 🧩 Technical Implementation

### Component Location
```
/client/src/components/ChatBot.tsx
```

### Integration
```tsx
// In landing-new.tsx
import ChatBot from '@/components/ChatBot';

// Inside component JSX
<ChatBot />
```

---

## 📡 API Integration

### Endpoint
```
POST http://127.0.0.1:5001/api/v1/create
```

### Request Headers
```json
{
  "authorization": "Bearer nxs-aXkDVM7aAVNVuVcYa6FqoLDD98fHIwOF4VVX-tkcHgs",
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "model": "meta-llama/llama-3.3-8b-instruct:free",
  "prompt": "<user_message>",
  "max_tokens": 200,
  "temperature": 0.5,
  "stream": true,
  "cache_threshold": 0.50,
  "is_cached": false,
  "use_rag": false
}
```

### Response Format (Streaming)
```json
{
  "id": "gen-1760553184-NzP5bYFkM6DNCtUiacrp",
  "provider": "Meta",
  "model": "meta-llama/llama-3.3-8b-instruct:free",
  "object": "chat.completion.chunk",
  "created": 1760553185,
  "choices": [
    {
      "index": 0,
      "finish_reason": null,
      "native_finish_reason": null,
      "logprobs": null,
      "text": "..."
    }
  ],
  "usage": {
    "prompt_tokens": 17,
    "completion_tokens": 200,
    "total_tokens": 217
  }
}
```

### Streaming Handler
```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();
let accumulatedText = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;

      const parsed = JSON.parse(data);
      const text = parsed.choices?.[0]?.text || '';
      
      accumulatedText += text;
      // Update UI with accumulated text
    }
  }
}
```

---

## 🎨 UI/UX Design

### Floating Bot Button
```tsx
- Position: fixed bottom-6 right-6
- Size: 64px × 64px (w-16 h-16)
- Background: Gradient from indigo-500 to purple-600
- Animation: Pulse ring + hover scale
- Icon: MessageCircle (Lucide)
```

### Chat Window
```tsx
- Position: fixed bottom-6 right-6
- Size: 
  - Width: max-w-md (448px)
  - Height: 600px
  - Mobile: Full width with padding
- Background: slate-900/95 with backdrop blur
- Border: slate-700/50
- Shadow: 2xl
```

### Header
```tsx
- Background: Gradient overlay (indigo/purple)
- Title: "Nexus AI Assistant"
- Status Indicator: Green pulsing dot + "Online"
- Close Button: X icon (top-right)
```

### Message Bubbles
```tsx
User Messages:
- Alignment: Right
- Background: Gradient purple-500 to pink-500
- Text Color: White
- Border Radius: 2xl (rounded-2xl)

Bot Messages:
- Alignment: Left
- Background: slate-800/80
- Border: slate-700/50
- Text Color: slate-100
- Streaming Cursor: Blinking vertical line

System Messages:
- Background: amber-500/10
- Border: amber-500/30
- Icon: AlertCircle (amber)
- Text Color: amber-200
```

### Input Area
```tsx
- Background: slate-800
- Border: slate-700
- Focus: Indigo-500 border
- Send Button: Gradient indigo to purple
- Loading State: Spinning Loader2 icon
```

---

## 🔧 State Management

### Component State
```typescript
const [isOpen, setIsOpen] = useState(false);
const [hasStarted, setHasStarted] = useState(false);
const [messages, setMessages] = useState<Message[]>([]);
const [inputValue, setInputValue] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [isStreaming, setIsStreaming] = useState(false);
```

### Message Interface
```typescript
interface Message {
  role: 'bot' | 'user' | 'system';
  content: string;
  isStreaming?: boolean;
}
```

### Refs
```typescript
const chatEndRef = useRef<HTMLDivElement>(null);
const abortControllerRef = useRef<AbortController | null>(null);
```

---

## 🛡️ Error Handling

### Network Errors
```typescript
try {
  // API call
} catch (error: any) {
  if (error.name === 'AbortError') {
    console.log('Request aborted');
    return;
  }
  
  // Show error message to user
  setMessages(prev => [...prev, {
    role: 'bot',
    content: '❌ Sorry, I encountered an error. Please try again.',
    isStreaming: false
  }]);
}
```

### Request Cancellation
```typescript
// On component unmount or chat close
if (abortControllerRef.current) {
  abortControllerRef.current.abort();
}
```

### Invalid JSON Chunks
```typescript
try {
  const parsed = JSON.parse(data);
  // Process chunk
} catch (e) {
  console.warn('Failed to parse chunk:', data);
  // Skip invalid chunk
}
```

---

## 🎯 Animations

### Chat Window Entry
```css
.animate-fade-in-scale {
  animation: fadeInScale 0.6s ease-out forwards;
}
```

### Pulse Ring (Bot Button)
```tsx
<span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" />
```

### Loading Dots
```tsx
<div className="flex gap-1">
  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce animation-delay-200" />
  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce animation-delay-400" />
</div>
```

### Streaming Cursor
```tsx
{message.isStreaming && (
  <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse" />
)}
```

### Auto-scroll
```typescript
useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
```

---

## 📱 Responsive Behavior

### Mobile (< 768px)
```
- Chat window: Full width with padding
- Font sizes: Slightly reduced
- Input area: Single column layout
```

### Tablet (768px - 1024px)
```
- Chat window: max-w-md (448px)
- All features visible
- Optimized touch targets
```

### Desktop (> 1024px)
```
- Chat window: max-w-md (448px)
- Hover effects enabled
- Full animation suite
```

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Bot button appears in bottom-right corner
- [ ] Clicking bot button opens chat window
- [ ] Initial system message displays correctly
- [ ] "Start Conversation" button works
- [ ] Welcome message appears after starting
- [ ] User can type and send messages
- [ ] Enter key sends message
- [ ] Send button sends message
- [ ] Streaming responses display in real-time
- [ ] Cursor blinks during streaming
- [ ] Auto-scroll works correctly
- [ ] Loading indicator shows during API call
- [ ] Error messages display on failure
- [ ] Closing chat clears all messages
- [ ] Reopening chat starts fresh session

### UI/UX Tests
- [ ] Bot button has pulse animation
- [ ] Chat window slides in smoothly
- [ ] Message bubbles have correct colors
- [ ] User messages align right
- [ ] Bot messages align left
- [ ] System messages have warning style
- [ ] Input field is disabled during loading
- [ ] Send button shows loading spinner
- [ ] Responsive on mobile devices
- [ ] Responsive on tablets
- [ ] Responsive on desktop

### Performance Tests
- [ ] No memory leaks on close
- [ ] AbortController cancels requests
- [ ] Smooth scrolling performance
- [ ] Streaming doesn't lag UI
- [ ] Animation performance is smooth

---

## 🚀 Deployment

### Environment Variables
```bash
# Ensure API endpoint is accessible
VITE_API_URL=http://127.0.0.1:5001
```

### CORS Configuration
```python
# Backend needs CORS headers for streaming
from flask_cors import CORS

CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

---

## 🔄 Future Enhancements

### Possible Improvements
1. **Session Persistence** (Optional)
   - Add localStorage to save chat history
   - Allow users to toggle session mode

2. **Multi-language Support**
   - Detect user language
   - Translate bot responses

3. **Voice Input**
   - Add speech-to-text for user input
   - Text-to-speech for bot responses

4. **Rich Media**
   - Support images in messages
   - Code syntax highlighting
   - Markdown rendering

5. **Analytics**
   - Track conversation metrics
   - User satisfaction feedback
   - Popular queries

6. **Customization**
   - Allow users to choose AI model
   - Adjust response length/temperature
   - Theme customization

---

## 📝 Example Conversation

```
🤖 System:
This bot does not maintain any session. If you start again, 
it will be treated as a new session.

[User clicks Start Conversation]

🤖 Bot:
💬 Welcome to Nexus AI Hub! What can we help you with today?

👤 User:
How is Manipal Cigna?

🤖 Bot (streaming):
Manipal Cigna is a leading health insurance provider in India...
[text continues streaming character by character]

👤 User:
What are the key features?

🤖 Bot (streaming):
The key features of Manipal Cigna health insurance include...
[streaming continues]
```

---

## 🐛 Troubleshooting

### Bot button not appearing
**Solution**: Check that ChatBot component is imported and rendered in landing-new.tsx

### Streaming not working
**Solution**: 
1. Verify API endpoint is running
2. Check CORS configuration
3. Ensure authorization token is valid
4. Check network tab for request/response

### Messages not auto-scrolling
**Solution**: Verify chatEndRef is properly attached to scroll target div

### Chat doesn't reset on close
**Solution**: Check that setTimeout in handleClose is executing properly

### API errors
**Solution**: 
1. Check backend logs
2. Verify request payload format
3. Test endpoint with curl command
4. Check authorization token

---

## 📚 Dependencies

### Required Packages
```json
{
  "@radix-ui/react-*": "Latest", // For UI components
  "lucide-react": "Latest", // For icons
  "react": "^18.0.0",
  "react-dom": "^18.0.0"
}
```

### UI Components Used
- `Button` - Send button, Start button
- `Input` - User message input
- `Card` - Chat window container
- `CardHeader` - Chat header
- `CardContent` - Messages area

### Icons Used
- `MessageCircle` - Bot button, header icon
- `X` - Close button
- `Send` - Send message button
- `Loader2` - Loading spinner
- `AlertCircle` - System message icon

---

## ✅ Summary

The ChatBot component provides a complete, production-ready AI assistant for the landing page with:

✅ No session persistence (fresh start every time)  
✅ Streaming responses with real-time typing effect  
✅ Responsive design for all screen sizes  
✅ Error handling and request cancellation  
✅ Beautiful dark theme with neon gradients  
✅ Smooth animations and transitions  
✅ Accessible and user-friendly interface  

**Ready to use!** Simply ensure the backend API is running and the component will work out of the box.
