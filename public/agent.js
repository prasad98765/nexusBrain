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
    conversationId: null,
    agentInfo: null,
    theme: {}
  };

  // Generate a unique conversation ID
  function generateConversationId() {
    return 'conv_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Fetch agent details and theme
  async function fetchAgentInfo() {
    try {
      const response = await fetch(`${baseUrl}/api/agents/${agentId}/embed-info?workspace_id=${workspaceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch agent info');
      }
      const agentInfo = await response.json();
      window.nexusAiAgent.agentInfo = agentInfo;
      window.nexusAiAgent.theme = agentInfo.theme || {};
      return agentInfo;
    } catch (error) {
      console.error('Nexus AI Agent: Error fetching agent info:', error);
      // Use default theme if fetch fails
      window.nexusAiAgent.theme = {
        primaryColor: '#6366f1',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '12px',
        iconSize: '60px',
        position: 'bottom-right'
      };
      return null;
    }
  }

  // Create chatbot icon with theme
  function createChatIcon() {
    const theme = window.nexusAiAgent.theme;
    const icon = document.createElement('div');
    icon.id = 'nexus-ai-chat-icon';
    
    // Get position coordinates
    const position = theme.position || 'bottom-right';
    const [vertical, horizontal] = position.split('-');
    const positionStyle = `
      ${vertical}: 20px;
      ${horizontal}: 20px;
    `;
    
    icon.innerHTML = `
      <div style="
        position: fixed;
        ${positionStyle}
        width: ${theme.iconSize || '60px'};
        height: ${theme.iconSize || '60px'};
        background: ${theme.primaryColor || '#6366f1'};
        border-radius: 50%;
        cursor: pointer;
        z-index: 2147483647;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        font-family: ${theme.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
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

  // Create chat iframe with theme
  function createChatIframe() {
    const theme = window.nexusAiAgent.theme;
    const agentInfo = window.nexusAiAgent.agentInfo;
    const container = document.createElement('div');
    container.id = 'nexus-ai-chat-container';
    
    // Get position coordinates for iframe
    const position = theme.position || 'bottom-right';
    const [vertical, horizontal] = position.split('-');
    const positionStyle = `
      ${vertical}: 100px;
      ${horizontal}: 20px;
    `;
    
    container.innerHTML = `
      <div style="
        position: fixed;
        ${positionStyle}
        width: 350px;
        height: 500px;
        background: ${theme.backgroundColor || 'white'};
        border-radius: ${theme.borderRadius || '12px'};
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        z-index: 2147483646;
        overflow: hidden;
        transition: all 0.3s ease;
        transform: scale(0.95) translateY(10px);
        opacity: 0;
        display: none;
        font-family: ${theme.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
      " id="chat-window">
        <div style="
          height: 50px;
          background: ${theme.primaryColor || '#6366f1'};
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          color: white;
        ">
          <div style="font-weight: 500;">${agentInfo?.name || 'AI Assistant'}</div>
          <div style="cursor: pointer; padding: 4px;" onclick="window.nexusAiAgent.closeChat()">✕</div>
        </div>
        <iframe 
          id="nexus-ai-chat-iframe"
          src="${baseUrl}/chatbot?workspace=${workspaceId}&agent=${agentId}&conversation=${generateConversationId()}"
          style="
            width: 100%;
            height: calc(100% - 50px);
            border: none;
            background: ${theme.backgroundColor || 'white'};
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
  async function init() {
    console.log('Nexus AI Agent: Initializing...');
    await fetchAgentInfo();
    createChatIcon();
    createChatIframe();
    console.log('Nexus AI Agent: Ready!');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();