# OpenRouter API Response

## Metadata
- **Model**: openai/gpt-4o
- **Timestamp**: 2025-10-02T09:39:53.537Z
- **Duration**: 21.981 seconds

## Token Usage
- **Prompt Tokens**: 86
- **Completion Tokens**: 1427
- **Total Tokens**: 1513

## Prompt
```
In a single HTML file with no other file dependencies, create a Chatbot messaging screen that can use an OpenRouter API Key and select models from OpenRouter https://openrouter.ai/api/v1/models, from there store the Key localy and allow use to try the model in the chatbot. You can use external
dependencies but only with CDNJS. Feel free to make pretty and shiny.


```

## Response
Creating a simple chatbot interface using HTML, JavaScript, and CSS that can interact with OpenRouter's API requires a few steps. Below is a complete solution using HTML and JavaScript. We'll use CDNs for any external libraries needed. This example will include functionality to input an API key, select a model from OpenRouter's available models, and send a message to the model.

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chatbot Interface with OpenRouter</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.4/css/bulma.min.css" integrity="sha512-/7gQb8U2+5zQ4Q1HQ3gGghBf8p2HfG1+MEcXfM/0ACgM4QsrI1E0JmRRI7ztpV3YJm7F9gK8bZx0LZ0h3qXw1Q==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <style>
        body {
            background-color: #f5f5f5;
            padding: 20px;
        }

        #chat-container {
            max-width: 600px;
            margin: auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 20px;
        }

        #messages {
            height: 300px;
            overflow-y: scroll;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            margin-bottom: 20px;
        }

        .message {
            margin-bottom: 10px;
            padding: 8px;
            border-radius: 4px;
        }

        .user-message {
            background-color: #d1e7dd;
            text-align: right;
        }

        .bot-message {
            background-color: #f8d7da;
        }

        #api-key-input {
            margin-bottom: 20px;
        }
    </style>
</head>

<body>
    <div id="chat-container">
        <h1 class="title">Chatbot with OpenRouter</h1>
        <div id="api-key-input">
            <input class="input" type="text" id="apiKey" placeholder="Enter OpenRouter API Key" />
            <button class="button is-link" onclick="saveApiKey()">Save API Key</button>
        </div>
        <div>
            <div class="select">
                <select id="modelSelect">
                    <option>Loading models...</option>
                </select>
            </div>
        </div>
        <div id="messages"></div>
        <div class="field has-addons">
            <div class="control is-expanded">
                <input class="input" type="text" id="userInput" placeholder="Type your message" />
            </div>
            <div class="control">
                <button class="button is-primary" onclick="sendMessage()">Send</button>
            </div>
        </div>
    </div>

    <script>
        const apiKey = localStorage.getItem('openrouterApiKey');
        const apiUrl = 'https://openrouter.ai/api/v1/models';
        let models = [];

        document.addEventListener('DOMContentLoaded', () => {
            if (apiKey) {
                document.getElementById('apiKey').value = apiKey;
                loadModels();
            }
        });

        function saveApiKey() {
            const key = document.getElementById('apiKey').value;
            localStorage.setItem('openrouterApiKey', key);
            loadModels();
        }

        async function loadModels() {
            try {
                const response = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('openrouterApiKey')}`
                    }
                });
                models = await response.json();
                const modelSelect = document.getElementById('modelSelect');
                modelSelect.innerHTML = '';
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = model.name;
                    modelSelect.appendChild(option);
                });
            } catch (error) {
                alert('Failed to load models. Check your API key.');
            }
        }

        async function sendMessage() {
            const userInput = document.getElementById('userInput').value;
            const messagesDiv = document.getElementById('messages');

            if (!userInput) return;

            const userMessage = document.createElement('div');
            userMessage.className = 'message user-message';
            userMessage.textContent = userInput;
            messagesDiv.appendChild(userMessage);
            document.getElementById('userInput').value = '';

            const selectedModel = document.getElementById('modelSelect').value;

            try {
                const response = await fetch(`https://openrouter.ai/api/v1/chat/${selectedModel}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('openrouterApiKey')}`
                    },
                    body: JSON.stringify({ input: userInput })
                });

                const data = await response.json();
                const botMessage = document.createElement('div');
                botMessage.className = 'message bot-message';
                botMessage.textContent = data.response || 'Error: No response from the model.';
                messagesDiv.appendChild(botMessage);
            } catch (error) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'message bot-message';
                errorMessage.textContent = 'Error: Unable to communicate with API.';
                messagesDiv.appendChild(errorMessage);
            }

            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    </script>
</body>

</html>
```

### Explanation:

- **HTML & Bulma CSS**: We use Bulma CSS for styling to make the interface look clean and user-friendly.
- **Local Storage**: The API key is stored in local storage to persist it across sessions.
- **API Interaction**: The script fetches the available models from OpenRouter and populates a dropdown menu. Upon sending a message, it sends a request to the selected model and displays the bot's response.
- **Error Handling**: Basic error handling is included to notify the user if the API key is invalid or if there are issues with API communication.

---
*Generated by OpenRouter CLI*