// Firebase Configuration (Replace with your own)
const firebaseConfig = {
    apiKey: "AIzaSyAKNdNQrZRs1Fx7FQnTw3GABYbrqihcoMk",
    authDomain: "the-m-float.firebaseapp.com",
    projectId: "the-m-float",
    storageBucket: "the-m-float.firebasestorage.app",
    messagingSenderId: "91662213348",
    appId: "1:91662213348:web:5777527c8eb4db851c4cf1"
  };

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const loginButton = document.getElementById('login-button');
const loginMessage = document.getElementById('login-message');

loginButton.addEventListener('click', () => {
    const username = document.getElementById('dealer-username').value;
    const password = document.getElementById('dealer-password').value;

    db.collection('dealers')
        .where('username', '==', username)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const dealerData = doc.data();
                    if (dealerData.password === password) { // Simple password check (replace with hashing in production)
                        console.log('Dealer found:', doc.id);

                        // Log successful login
                        db.collection('logs').add({
                            dealerId: doc.id,
                            username: username,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            status: 'success'
                        }).then(() => {
                            console.log('Login log added successfully.');
                            window.location.href = 'main.html'; // Redirect on success
                        }).catch((logError) => {
                            console.error('Error adding login log:', logError);
                            window.location.href = 'main.html'; // Redirect even if log fails, but log error.
                        });

                    } else {
                        loginMessage.textContent = 'Invalid password.';

                        // Log failed login (invalid password)
                        db.collection('logs').add({
                            username: username,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            status: 'failure - invalid password'
                        }).catch((logError) => {
                            console.error('Error adding login log:', logError);
                        });
                    }
                });
            } else {
                loginMessage.textContent = 'Dealer not found.';

                // Log failed login (dealer not found)
                db.collection('logs').add({
                    username: username,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'failure - dealer not found'
                }).catch((logError) => {
                    console.error('Error adding login log:', logError);
                });
            }
        })
        .catch((error) => {
            console.error('Login error:', error);
            loginMessage.textContent = 'An error occurred. Please try again.';

            // Log general login error
            db.collection('logs').add({
                username: username,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'failure - general error'
            }).catch((logError) => {
                console.error('Error adding login log:', logError);
            });
        });
});