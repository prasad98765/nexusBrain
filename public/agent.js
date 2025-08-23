(function() {
  'use strict';

  // Get script attributes
  const currentScript = document.currentScript || document.querySelector('script[data-workspace-id]');
  const workspaceId = currentScript?.getAttribute('data-workspace-id');
  const agentId = currentScript?.getAttribute('data-agent-id');
  const baseUrl = currentScript?.src?.replace('/agent.js', '') || window.location.origin;

  if (!workspaceId || !agentId) {
    console.error('Nexus AI Agent: Missing workspace-id or agent-id attributes');
    return;
  }

  // Prevent multiple instances
  if (window.nexusAiAgent) {
    return;
  }

  window.nexusAiAgent = {
    workspaceId,
    agentId,
    baseUrl,
    isOpen: false,
    conversationId: null
  };

  // Generate a unique conversation ID
  function generateConversationId() {
    return 'conv_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Create chatbot icon
  function createChatIcon() {
    const icon = document.createElement('div');
    icon.id = 'nexus-ai-chat-icon';
    icon.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        cursor: pointer;
        z-index: 2147483647;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
    `;
    
    icon.addEventListener('click', toggleChat);
    document.body.appendChild(icon);
    return icon;
  }

  // Create chat iframe
  function createChatIframe() {
    const container = document.createElement('div');
    container.id = 'nexus-ai-chat-container';
    container.innerHTML = `
      <div style="
        position: fixed;
        bottom: 100px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        z-index: 2147483646;
        overflow: hidden;
        transition: all 0.3s ease;
        transform: scale(0.95) translateY(10px);
        opacity: 0;
        display: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      " id="chat-window">
        <div style="
          height: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          color: white;
        ">
          <div style="font-weight: 500;">AI Assistant</div>
          <div style="cursor: pointer; padding: 4px;" onclick="window.nexusAiAgent.closeChat()">✕</div>
        </div>
        <iframe 
          id="nexus-ai-chat-iframe"
          src="${baseUrl}/chatbot?workspace=${workspaceId}&agent=${agentId}&conversation=${generateConversationId()}"
          style="
            width: 100%;
            height: calc(100% - 50px);
            border: none;
            background: white;
          "
          allow="microphone; camera"
        ></iframe>
      </div>
    `;
    
    document.body.appendChild(container);
    return container;
  }

  // Toggle chat window
  function toggleChat() {
    if (!window.nexusAiAgent.isOpen) {
      openChat();
    } else {
      closeChat();
    }
  }

  // Open chat window
  function openChat() {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
      chatWindow.style.display = 'block';
      setTimeout(() => {
        chatWindow.style.opacity = '1';
        chatWindow.style.transform = 'scale(1) translateY(0)';
      }, 10);
      window.nexusAiAgent.isOpen = true;
    }
  }

  // Close chat window
  function closeChat() {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
      chatWindow.style.opacity = '0';
      chatWindow.style.transform = 'scale(0.95) translateY(10px)';
      setTimeout(() => {
        chatWindow.style.display = 'none';
      }, 300);
      window.nexusAiAgent.isOpen = false;
    }
  }

  // Expose functions globally
  window.nexusAiAgent.openChat = openChat;
  window.nexusAiAgent.closeChat = closeChat;
  window.nexusAiAgent.toggleChat = toggleChat;

  // Initialize when DOM is ready
  function init() {
    createChatIcon();
    createChatIframe();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();