document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
    addEventListeners();
});

let isRequestInProgress = false; // Initialize the flag
let isTyping = false; // Flag to check if typing effect is in progress

function initializeChat() {
    setTimeout(function() {
        const chatBody = document.getElementById('chat-body');
        if (!chatBody) {
            console.error('Chat body element not found');
            return;
        }

        const botMessage = createBotMessage("Hello there! I am here to answer questions specifically about Farhaan. You can chat with me via images as well 🤗");
        chatBody.appendChild(botMessage);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 1000);
}

function createBotMessage(messageContent) {
    const botMessage = document.createElement('div');
    botMessage.classList.add('message', 'bot-message');
    botMessage.innerHTML = `
        <div class="message-content">
            <div class="bot-svg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b5afaf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-robot">
                    <path d="M16 8V4a4 4 0 1 0-8 0v4"></path>
                    <rect x="3" y="8" width="18" height="12" rx="2"></rect>
                    <path d="M7 18v-4a4 4 0 0 1 8 0v4"></path>
                </svg>
            </div>
            <div class="bot-text">
                <p></p>
            </div>
        </div>
    `;
    typeEffect(botMessage.querySelector('.bot-text p'), messageContent);
    return botMessage;
}

function typeEffect(element, text, delay = 30) {
    isTyping = true;
    let index = 0;
    function type() {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
            setTimeout(type, delay);
        } else {
            isTyping = false; // Typing effect is done
            isRequestInProgress = false; // Allow sending messages again
        }
    }
    type();
}

function createUserMessage(messageContent) {
    const userMessage = document.createElement('div');
    userMessage.classList.add('message', 'user-message');
    userMessage.innerHTML = `
        <div class="message-content">
            <div class="user-svg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b5afaf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user">
                    <path d="M20.88 18.09A10 10 0 1 0 12 22a9.71 9.71 0 0 0 8.88-3.91"></path>
                    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5z"></path>
                </svg>
            </div>
            <div class="user-text">
                <p>${messageContent}</p>
            </div>
        </div>
    `;
    return userMessage;
}

function createImageMessage(imageUrl, sender) {
    const imageMessage = document.createElement('div');
    imageMessage.classList.add('message', `${sender}-message`);
    imageMessage.innerHTML = `
        <div class="message-content">
            <div class="${sender}-svg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b5afaf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-${sender}">
                    <path d="${sender === 'user' ? 'M20.88 18.09A10 10 0 1 0 12 22a9.71 9.71 0 0 0 8.88-3.91' : 'M16 8V4a4 4 0 1 0-8 0v4'}"></path>
                    <path d="${sender === 'user' ? 'M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5z' : 'M7 18v-4a4 4 0 0 1 8 0v4'}"></path>
                </svg>
            </div>
            <div class="${sender}-text">
                <img src="${imageUrl}" alt="Uploaded image" class="large-image" style="margin-left: 10px; margin-top: 6px;">
            </div>
        </div>
    `;
    return imageMessage;
}

let imageFile = null;

function addEventListeners() {
    const sendButton = document.getElementById('send-button');
    const chatInput = document.getElementById('chat-input');
    const fileInput = document.getElementById('file-input');

    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        imageFile = file;
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageUrl = e.target.result;
            const imagePreviewContainer = document.getElementById('image-preview-container');
            imagePreviewContainer.innerHTML = ''; // Clear any existing previews

            const imageElement = document.createElement('img');
            imageElement.src = imageUrl;
            imageElement.alt = 'Uploaded image';
            imageElement.classList.add('small-image');

            imagePreviewContainer.appendChild(imageElement);

            alert('You will have to enter the prompt now along with the image.');
        };
        reader.readAsDataURL(file);
    }
}

function sendMessage() {
    if (isRequestInProgress || isTyping) {
        alert('Please wait for the current response to complete before sending a new message.');
        return;
    }

    const chatInput = document.getElementById('chat-input');
    const chatBody = document.getElementById('chat-body');
    const imagePreviewContainer = document.getElementById('image-preview-container');

    if (!chatInput || !chatBody) {
        console.error('Chat input or chat body element not found');
        return;
    }

    const message = chatInput.value.trim();

    if (imageFile && message) {
        // Create and append user message with image preview
        const userMessage = createUserMessageWithImage(message, imageFile);
        chatBody.appendChild(userMessage);

        // Scroll to the bottom of the chat after sending user message
        chatBody.scrollTop = chatBody.scrollHeight;

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('prompt', message);

        isRequestInProgress = true; // Set the flag to true

        // Send the combined data to the backend
        fetch('/process-image-and-prompt', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            const botResponse = data.response;

            // Create and append bot message
            const botMessage = createBotMessage(botResponse);
            chatBody.appendChild(botMessage);

            // Scroll to the bottom of the chat after bot response
            chatBody.scrollTop = chatBody.scrollHeight;

            // isRequestInProgress will be reset in typeEffect function
        })
        .catch(error => {
            console.error('Error:', error);
            isRequestInProgress = false; // Reset the flag even on error
        });

        // Clear input and reset file input
        chatInput.value = '';
        imageFile = null;
        imagePreviewContainer.innerHTML = '';
        document.getElementById('file-input').value = '';
    } else if (!message) {
        alert('Please enter your prompt');
    } else {
        // Handle case where only prompt is entered
        if (message) {
            // Create and append user message
            const userMessage = createUserMessage(message);
            chatBody.appendChild(userMessage);

            // Scroll to the bottom of the chat after sending user message
            chatBody.scrollTop = chatBody.scrollHeight;

            isRequestInProgress = true; // Set the flag to true

            // Fetch bot response from backend
            fetch('/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            })
            .then(response => response.json())
            .then(data => {
                const botResponse = data.response;

                // Create and append bot message
                const botMessage = createBotMessage(botResponse);
                chatBody.appendChild(botMessage);

                // Scroll to the bottom of the chat after bot response
                chatBody.scrollTop = chatBody.scrollHeight;

                // isRequestInProgress will be reset in typeEffect function
            })
            .catch(error => {
                console.error('Error:', error);
                isRequestInProgress = false; // Reset the flag even on error
            });

            // Clear input after sending message
            chatInput.value = '';
        }
    }
}

function createUserMessageWithImage(messageContent, imageFile) {
    const userMessage = document.createElement('div');
    userMessage.classList.add('message', 'user-message');
    userMessage.innerHTML = `
        <div class="message-content">
            <div class="user-svg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b5afaf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user">
                    <path d="M20.88 18.09A10 10 0 1 0 12 22a9.71 9.71 0 0 0 8.88-3.91"></path>
                    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5z"></path>
                </svg>
            </div>
            <div class="user-text">
                <img src="${URL.createObjectURL(imageFile)}" alt="Uploaded image" style="display: block; margin-left: auto; margin-bottom: 10px;">
                <p>${messageContent}</p>
            </div>
        </div>
    `;
    return userMessage;
}
