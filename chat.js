require('dotenv').config(); // Add this line at the top of your file

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};
// Firebase Initialization
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Get sender ID from authentication or session
const senderId = localStorage.getItem("userId"); // Example: Store user ID in local storage after login
if (!senderId) {
    alert("User not logged in!");
    window.location.href = "index.html"; // Redirect to login page
}

// Fetch sender details from `dealers`
db.collection("dealers").doc(senderId).get().then(doc => {
    if (doc.exists) {
        const senderName = doc.data().name || "Unknown Dealer";

        // Fetch assigned handler (Responder) from messages or assign one
        db.collection("messages")
            .where("sender", "==", senderId)
            .limit(1) // Check if user has previous chat
            .get()
            .then(snapshot => {
                let responderId = "";
                let responderName = "Support Agent";

                if (!snapshot.empty) {
                    // If user has previous chat, use existing responder
                    const existingMessage = snapshot.docs[0].data();
                    responderId = existingMessage.responder;
                    responderName = existingMessage.responderName;
                } else {
                    // If first time, assign a responder from `handlers`
                    db.collection("handlers").limit(1).get().then(handlerSnapshot => {
                        if (!handlerSnapshot.empty) {
                            const handlerDoc = handlerSnapshot.docs[0].data();
                            responderId = handlerDoc.id;
                            responderName = handlerDoc.name;
                        }
                    });
                }

                // Send Message Function
                function sendMessage() {
                    const messageText = document.getElementById("chat-message").value.trim();
                    if (!messageText) return;

                    db.collection("messages").add({
                        sender: senderId,
                        senderName: senderName,
                        responder: responderId,
                        responderName: responderName,
                        text: messageText,
                        type: "sent",
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        document.getElementById("chat-message").value = "";
                    }).catch(error => {
                        console.error("Error sending message: ", error);
                    });
                }

                // Attach Event Listener to Send Button
                document.getElementById("send-message-button").addEventListener("click", sendMessage);
                document.getElementById("chat-message").addEventListener("keypress", (e) => {
                    if (e.key === "Enter") sendMessage();
                });
            });
    } else {
        console.error("Sender data not found!");
    }
});
// Load chat messages
function loadChatMessages() {
    db.collection("messages")
        .where("sender", "==", senderId)
        .orderBy("timestamp", "asc")
        .onSnapshot(snapshot => {
            const chatMessages = document.getElementById("chat-messages");
            chatMessages.innerHTML = ""; // Clear previous messages

            snapshot.forEach(doc => {
                const msg = doc.data();
                const messageDiv = document.createElement("div");
                messageDiv.classList.add("message", msg.type === "sent" ? "sent" : "received");
                messageDiv.innerHTML = `<p>${msg.text}</p><span>${new Date(msg.timestamp).toLocaleTimeString()}</span>`;
                chatMessages.appendChild(messageDiv);
            });

            // Auto-scroll to latest message
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
}

// Load chat on page load
loadChatMessages();
