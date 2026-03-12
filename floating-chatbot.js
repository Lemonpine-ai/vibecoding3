const CLOUDFLARE_WORKER_URL_FOR_FLOATING = "https://voimeow-chatbot-api.YOUR_SUBDOMAIN.workers.dev";

const floatingChatbotConversationHistory = [
  {
    role: "system",
    content: "안녕하세요. 너는 VoiMeow 고객센터의 친절한 상담원이야. 고양이 관련 제품과 서비스에 대해 도움을 주고, 사용자의 질문에 정중하고 도움이 되는 답변을 제공해주세요."
  }
];

const floatingChatbotWidget = document.getElementById("floating-chatbot");
const floatingChatbotMessagesContainer = document.getElementById("floatingChatbotMessages");
const floatingChatbotUserInput = document.getElementById("floatingChatbotInput");
const floatingChatbotSendButton = document.getElementById("floatingChatbotSendButton");
const floatingChatbotMinimizeButton = document.querySelector(".floating-chatbot-minimize");
const floatingChatbotCloseButton = document.querySelector(".floating-chatbot-close");

function showFloatingChatbot() {
  if (floatingChatbotWidget) {
    floatingChatbotWidget.style.display = "flex";
    floatingChatbotWidget.classList.remove("minimized");
    
    if (floatingChatbotMessagesContainer && floatingChatbotMessagesContainer.children.length === 0) {
      appendFloatingChatbotMessage("안녕하세요! 저는 VoiMeow의 AI 상담원입니다. 고양이 관련 서비스에 대해 궁금하신 점을 물어보세요! 😊", "assistant");
    }
    
    floatingChatbotUserInput?.focus();
  }
}

function hideFloatingChatbot() {
  if (floatingChatbotWidget) {
    floatingChatbotWidget.style.display = "none";
  }
}

function toggleMinimizeFloatingChatbot() {
  if (floatingChatbotWidget) {
    floatingChatbotWidget.classList.toggle("minimized");
  }
}

async function sendMessageToWorkerFromFloatingChatbot(userMessageText) {
  floatingChatbotConversationHistory.push({
    role: "user",
    content: userMessageText
  });

  try {
    const apiResponse = await fetch(CLOUDFLARE_WORKER_URL_FOR_FLOATING, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: floatingChatbotConversationHistory
      })
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error || apiResponse.statusText);
    }

    const responseData = await apiResponse.json();
    const assistantReplyContent = responseData.message;
    
    floatingChatbotConversationHistory.push({
      role: "assistant",
      content: assistantReplyContent
    });

    return assistantReplyContent;
  } catch (error) {
    console.error("API 호출 중 오류 발생:", error);
    throw new Error(`API 요청 실패: ${error.message}`);
  }
}

function appendFloatingChatbotMessage(messageContent, messageSenderRole) {
  const messageWrapper = document.createElement("div");
  messageWrapper.classList.add("chatbot-message");
  messageWrapper.classList.add(messageSenderRole === "user" ? "user-message" : "assistant-message");
  
  const avatarElement = document.createElement("div");
  avatarElement.classList.add("chatbot-message-avatar");
  avatarElement.textContent = messageSenderRole === "user" ? "👤" : "🤖";
  
  const contentElement = document.createElement("div");
  contentElement.classList.add("chatbot-message-content");
  contentElement.textContent = messageContent;
  
  messageWrapper.appendChild(avatarElement);
  messageWrapper.appendChild(contentElement);
  floatingChatbotMessagesContainer.appendChild(messageWrapper);
  
  floatingChatbotMessagesContainer.scrollTop = floatingChatbotMessagesContainer.scrollHeight;
}

function displayFloatingChatbotLoadingIndicator() {
  const loadingWrapper = document.createElement("div");
  loadingWrapper.classList.add("chatbot-message", "assistant-message");
  loadingWrapper.id = "floatingChatbotLoadingIndicator";
  
  const avatarElement = document.createElement("div");
  avatarElement.classList.add("chatbot-message-avatar");
  avatarElement.textContent = "🤖";
  
  const loadingContent = document.createElement("div");
  loadingContent.classList.add("chatbot-loading-indicator");
  
  for (let i = 0; i < 3; i++) {
    const dotElement = document.createElement("div");
    dotElement.classList.add("chatbot-loading-dot");
    loadingContent.appendChild(dotElement);
  }
  
  loadingWrapper.appendChild(avatarElement);
  loadingWrapper.appendChild(loadingContent);
  floatingChatbotMessagesContainer.appendChild(loadingWrapper);
  
  floatingChatbotMessagesContainer.scrollTop = floatingChatbotMessagesContainer.scrollHeight;
}

function removeFloatingChatbotLoadingIndicator() {
  const loadingElement = document.getElementById("floatingChatbotLoadingIndicator");
  if (loadingElement) {
    loadingElement.remove();
  }
}

function toggleFloatingChatbotInputState(isDisabled) {
  floatingChatbotSendButton.disabled = isDisabled;
  floatingChatbotUserInput.disabled = isDisabled;
}

async function handleFloatingChatbotSendMessage() {
  const userInputText = floatingChatbotUserInput.value.trim();
  
  if (!userInputText) {
    return;
  }
  
  appendFloatingChatbotMessage(userInputText, "user");
  floatingChatbotUserInput.value = "";
  floatingChatbotUserInput.style.height = "auto";
  
  toggleFloatingChatbotInputState(true);
  displayFloatingChatbotLoadingIndicator();
  
  try {
    const assistantReply = await sendMessageToWorkerFromFloatingChatbot(userInputText);
    removeFloatingChatbotLoadingIndicator();
    appendFloatingChatbotMessage(assistantReply, "assistant");
  } catch (error) {
    removeFloatingChatbotLoadingIndicator();
    appendFloatingChatbotMessage(`죄송합니다. 오류가 발생했습니다: ${error.message}`, "assistant");
  } finally {
    toggleFloatingChatbotInputState(false);
    floatingChatbotUserInput.focus();
  }
}

floatingChatbotSendButton?.addEventListener("click", handleFloatingChatbotSendMessage);

floatingChatbotUserInput?.addEventListener("keypress", (keyboardEvent) => {
  if (keyboardEvent.key === "Enter" && !keyboardEvent.shiftKey) {
    keyboardEvent.preventDefault();
    handleFloatingChatbotSendMessage();
  }
});

floatingChatbotUserInput?.addEventListener("input", function() {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 80) + "px";
});

floatingChatbotCloseButton?.addEventListener("click", hideFloatingChatbot);

floatingChatbotMinimizeButton?.addEventListener("click", toggleMinimizeFloatingChatbot);

const floatingChatbotHeader = document.querySelector(".floating-chatbot-header");
let isDraggingChatbot = false;
let chatbotDragStartX = 0;
let chatbotDragStartY = 0;
let chatbotInitialLeft = 0;
let chatbotInitialBottom = 0;

floatingChatbotHeader?.addEventListener("mousedown", (mouseEvent) => {
  if (mouseEvent.target.closest('.floating-chatbot-controls')) {
    return;
  }
  
  isDraggingChatbot = true;
  chatbotDragStartX = mouseEvent.clientX;
  chatbotDragStartY = mouseEvent.clientY;
  
  const rect = floatingChatbotWidget.getBoundingClientRect();
  chatbotInitialLeft = rect.left;
  chatbotInitialBottom = window.innerHeight - rect.bottom;
  
  floatingChatbotWidget.style.transition = "none";
});

document.addEventListener("mousemove", (mouseEvent) => {
  if (!isDraggingChatbot) return;
  
  const deltaX = mouseEvent.clientX - chatbotDragStartX;
  const deltaY = mouseEvent.clientY - chatbotDragStartY;
  
  const newLeft = chatbotInitialLeft + deltaX;
  const newBottom = chatbotInitialBottom - deltaY;
  
  floatingChatbotWidget.style.left = `${newLeft}px`;
  floatingChatbotWidget.style.bottom = `${newBottom}px`;
  floatingChatbotWidget.style.right = "auto";
});

document.addEventListener("mouseup", () => {
  if (isDraggingChatbot) {
    isDraggingChatbot = false;
    floatingChatbotWidget.style.transition = "";
  }
});

window.openFloatingChatbot = showFloatingChatbot;
