(function () {
  "use strict";

  // ========= CONFIG ==========
  const currentScript =
    document.currentScript ||
    document.querySelector("script[data-workspace-id]");
  const workspaceId = currentScript?.getAttribute("data-workspace-id");
  const agentId = currentScript?.getAttribute("data-agent-id");
  const baseUrl =
    currentScript?.src?.replace("/agent.js", "") || window.location.origin;

  if (!workspaceId || !agentId) {
    console.error(
      "Nexus AI Agent: Missing workspace-id or agent-id attributes"
    );
    return;
  }

  if (window.nexusAiAgent) return; // prevent multiple instances

  window.nexusAiAgent = {
    workspaceId,
    agentId,
    baseUrl,
    isOpen: false,
    conversationId: null,
    agentInfo: null,
    theme: {},
  };

  // ========= UTILS ==========
  function generateConversationId() {
    return (
      "conv_" +
      Math.random().toString(36).substr(2, 9) +
      Date.now().toString(36)
    );
  }

  function injectStyles() {
    if (document.getElementById("nexus-ai-agent-style")) return;

    const style = document.createElement("style");
    style.id = "nexus-ai-agent-style";
    style.innerHTML = `
      #nexus-ai-chat-icon {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: var(--icon-size, 60px);
        height: var(--icon-size, 60px);
        background: var(--primary-color, #6366f1);
        border-radius: 50%;
        cursor: pointer;
        z-index: 2147483647;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s ease;
      }
      #nexus-ai-chat-icon:hover {
        transform: scale(1.05);
      }

      #nexus-ai-chat-container {
        position: fixed;
        bottom: 100px;
        right: 20px;
        width: var(--chat-width, 350px);
        height: var(--chat-height, 500px);
        background: var(--bg-color, #fff);
        border-radius: var(--border-radius, 12px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        z-index: 2147483646;
        overflow: hidden;
        transform: scale(0.95) translateY(10px);
        opacity: 0;
        display: none;
        transition: all 0.3s ease;
        border: var(--border-width, 1px) solid var(--border-color, #e5e7eb);
      }
      #nexus-ai-chat-container.open {
        display: block;
        opacity: 1;
        transform: scale(1) translateY(0);
      }
      #nexus-ai-chat-header {
        height: 50px;
        background: var(--primary-color, #6366f1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        color: white;
        font-weight: 500;
      }
      #nexus-ai-chat-header .close-btn {
        cursor: pointer;
        padding: 4px;
      }
      #nexus-ai-chat-iframe {
        width: 100%;
        height: calc(100% - 50px);
        border: none;
        background: var(--bg-color, #fff);
      }
    `;
    document.head.appendChild(style);
  }

  async function fetchAgentInfo() {
    try {
      const res = await fetch(
        `${baseUrl}/api/agents/${agentId}/embed-info?workspace_id=${workspaceId}`
      );
      if (!res.ok) throw new Error("Failed to fetch agent info");
      const agentInfo = await res.json();
      window.nexusAiAgent.agentInfo = agentInfo;
      window.nexusAiAgent.theme = agentInfo.theme || {};
      applyTheme(agentInfo.theme);
    } catch (err) {
      console.error("Nexus AI Agent: Error fetching agent info:", err);
      applyTheme(); // fallback theme
    }
  }

  function applyTheme(theme = {}) {
    document.documentElement.style.setProperty(
      "--primary-color",
      theme.primaryColor || "#6366f1"
    );
    document.documentElement.style.setProperty(
      "--bg-color",
      theme.backgroundColor || "#fff"
    );
    document.documentElement.style.setProperty(
      "--text-color",
      theme.textColor || "#1f2937"
    );
    document.documentElement.style.setProperty(
      "--border-radius",
      theme.borderRadius || "12px"
    );
    document.documentElement.style.setProperty(
      "--icon-size",
      theme.iconSize || "60px"
    );
    document.documentElement.style.setProperty(
      "--chat-width",
      theme.chatWidth || "350px"
    );
    document.documentElement.style.setProperty(
      "--chat-height",
      theme.chatHeight || "500px"
    );
    document.documentElement.style.setProperty(
      "--border-width",
      theme.borderWidth || "1px"
    );
    document.documentElement.style.setProperty(
      "--border-color",
      theme.borderColor || "#e5e7eb"
    );
  }

  // ========= UI ==========
  function createChatIcon() {
    const icon = document.createElement("div");
    icon.id = "nexus-ai-chat-icon";
    icon.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" 
        stroke="white" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 
        2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    icon.addEventListener("click", toggleChat);
    document.body.appendChild(icon);
  }

  function createChatIframe() {
    const container = document.createElement("div");
    container.id = "nexus-ai-chat-container";

    const agentName = window.nexusAiAgent.agentInfo?.name || "AI Assistant";

    container.innerHTML = `
      <div id="nexus-ai-chat-header">
        <div>${agentName}</div>
        <div class="close-btn" onclick="window.nexusAiAgent.closeChat()">✕</div>
      </div>
      <iframe 
        id="nexus-ai-chat-iframe"
        src="${baseUrl}/chatbot?workspace=${workspaceId}&agent=${agentId}&conversation=${generateConversationId()}"
        allow="microphone; camera">
      </iframe>
    `;
    document.body.appendChild(container);
    
    // Listen for close messages from iframe
    if (!window.nexusAiAgent.messageListenerAdded) {
      window.addEventListener('message', function(event) {
        if (event.data === 'close-chat') {
          closeChat();
        }
      });
      window.nexusAiAgent.messageListenerAdded = true;
    }
  }

  // ========= STATE ==========
  function openChat() {
    document.getElementById("nexus-ai-chat-container")?.classList.add("open");
    window.nexusAiAgent.isOpen = true;

    // Call API when opened (like chatbot.com)
    // fetch(`${baseUrl}/api/agents/${agentId}/open?workspace_id=${workspaceId}`, {
    //   method: "POST",
    // }).catch(console.error);
  }

  function closeChat() {
    document
      .getElementById("nexus-ai-chat-container")
      ?.classList.remove("open");
    window.nexusAiAgent.isOpen = false;
  }

  function toggleChat() {
    if (window.nexusAiAgent.isOpen) closeChat();
    else openChat();
  }

  // ========= INIT ==========
  async function init() {
    injectStyles();
    await fetchAgentInfo();
    createChatIcon();
    createChatIframe();
    console.log("Nexus AI Agent: Ready!");
  }

  window.nexusAiAgent.openChat = openChat;
  window.nexusAiAgent.closeChat = closeChat;
  window.nexusAiAgent.toggleChat = toggleChat;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
