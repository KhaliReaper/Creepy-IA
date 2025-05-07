const entrada = document.getElementById("entrada");
const mensajes = document.getElementById("mensajes");
let iaModel = null; // Variable to store the loaded model

// Function to display a status message (optional, for UX)
function mostrarEstado(texto) {
    // You could have a specific element for status messages
    // or add a message to the chat with a special class.
    if (texto) { // Only add if there's text
        agregarMensaje(texto, "estado");
    }
    console.log(texto);
}

async function inicializarModelo() {
    mostrarEstado("AI: Loading model...");
    try {
        // Load the model only once
        // For transformers.js by Xenova, 'pipeline' is often used for common tasks.
        // 'text-generation' is the task, and 'Xenova/gpt2' is a gpt2 model converted for transformers.js.
        iaModel = await window.HuggingFaceTransformers.pipeline('text-generation', 'Xenova/gpt2');
        // If you were using a model that specifically requires 'load' and 'generate'
        // iaModel = await window.HuggingFaceTransformers.load("gpt2"); // Verify library docs for the correct method

        mostrarEstado("AI: Model loaded. You can chat now!");
    } catch (error) {
        console.error("Error loading model:", error);
        mostrarEstado("AI: Error loading model. Please try reloading the page.");
    }
}

async function responderIA(textoUsuario) {
    if (!iaModel) {
        mostrarEstado("AI: The model is not ready yet. Please wait a moment...");
        return "The model is not ready. Please wait.";
    }
    // Clear previous "Thinking..." or "Error" states if they were displayed in the chat
    // Or manage a dedicated status element
    const thinkingMessage = agregarMensaje("AI: Thinking...", "ia-status"); // Add a temporary thinking message

    try {
        // The way to generate text can vary.
        // For `pipeline`, it's often like this:
        const outputs = await iaModel(textoUsuario, { max_new_tokens: 50 }); // Adjust max_new_tokens as needed
        // The response is usually in a property like 'generated_text' within the first element of the array.
        // This can vary based on the model and task. Check Transformers.js and model documentation.
        let respuestaGenerada = outputs[0].generated_text;

        // You might need to clean the response (e.g., remove the input text if the model includes it)
        // For example, if the model returns "YourText. ModelResponse."
        if (respuestaGenerada.startsWith(textoUsuario)) {
            respuestaGenerada = respuestaGenerada.substring(textoUsuario.length).trim();
        }
        
        // Remove "Thinking..." message
        if(thinkingMessage) mensajes.removeChild(thinkingMessage);
        
        return respuestaGenerada || "I couldn't generate a response.";

    } catch (error) {
        console.error("Error generating response:", error);
        if(thinkingMessage) mensajes.removeChild(thinkingMessage); // Also remove if error occurs
        mostrarEstado("AI: There was an error generating the response.");
        return "Sorry, I couldn't process your request at this moment.";
    }
}

function agregarMensaje(texto, clase) {
    const div = document.createElement("div");
    div.className = `mensaje ${clase}`;
    // To prevent XSS issues if the text came from untrusted sources,
    // it's better to use textContent. If you expect HTML in the message (not recommended for raw AI input),
    // you would need to sanitize it.
    div.textContent = texto;
    mensajes.appendChild(div);
    mensajes.scrollTop = mensajes.scrollHeight;
    return div; // Return the div in case you want to remove it later (e.g., "Thinking..." message)
}

entrada.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && entrada.value.trim() !== "") {
        const textoUsuario = entrada.value.trim();
        agregarMensaje(`You: ${textoUsuario}`, "usuario");
        const currentInput = entrada.value; // Store current input in case of async issues
        entrada.value = "";

        if (iaModel) { // Only try to respond if the model is loaded
            const respuesta = await responderIA(currentInput.trim()); // Use the stored input
            agregarMensaje(`AI: ${respuesta}`, "ia");
        } else {
            agregarMensaje("AI: The model is still loading, please wait.", "ia");
        }
    }
});

// Call inicializarModelo when the script loads
inicializarModelo();
