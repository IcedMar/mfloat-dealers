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

const searchButton = document.getElementById('search-button');
const userDetails = document.getElementById('user-details');
const purchaseSection = document.getElementById('purchase-section');
const userStoreNumber = document.getElementById('user-store-number');
const userAgentNumber = document.getElementById('user-agent-number');
const userIdNumber = document.getElementById('user-id-number');
const userPhone = document.getElementById('user-phone');
const userBalance = document.getElementById('user-balance');
const proceedButton = document.getElementById('proceed-button');
const purchaseAmount = document.getElementById('purchase-amount');
const dealerPin = document.getElementById('dealer-pin');
const confirmPurchaseButton = document.getElementById('confirm-purchase-button');
const transactionMessage = document.getElementById('transaction-message');
const historyList = document.getElementById('history-list');

let selectedUserId;
let selectedUserPhoneNumber;

searchButton.addEventListener('click', () => {
    const storeNumber = document.getElementById('store-number').value;

    db.collection('users')
        .where('storeNumber', '==', storeNumber)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    userStoreNumber.textContent = userData.storeNumber;
                    userAgentNumber.textContent = userData.agentNumber;
                    userIdNumber.textContent = userData.idNumber;
                    userPhone.textContent = userData.mpesaNumber;
                    userBalance.textContent = userData.walletBalance / 100; // Assuming balance is stored in cents
                    userDetails.style.display = 'block';
                    transactionMessage.textContent = ''; // Clear previous messages
                    selectedUserId = doc.id;
                    selectedUserPhoneNumber = userData.phoneNumber;
                });
            } else {
                userDetails.style.display = 'none';
                purchaseSection.style.display = 'none';
                transactionMessage.textContent = 'User not found.';
            }
        })
        .catch((error) => {
            console.error('Search error:', error);
            transactionMessage.textContent = 'An error occurred. Please try again.';
        });
});

proceedButton.addEventListener('click', () => {
    userDetails.style.display = 'none';
    purchaseSection.style.display = 'block';
});

confirmPurchaseButton.addEventListener('click', () => {
    const amount = parseInt(purchaseAmount.value);
    const pin = dealerPin.value;

    if (!selectedUserId) {
        transactionMessage.textContent = 'Please search for a user first.';
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        transactionMessage.textContent = 'Please enter a valid amount.';
        return;
    }

    if (!pin) {
        transactionMessage.textContent = 'Please enter your dealer PIN.';
        return;
    }

    // TODO: Verify dealer PIN (Firestore or API)
    // Example: (Replace with your actual PIN verification logic)
    db.collection('dealers').doc('YOUR_DEALER_ID').get().then((dealerDoc) => {
        if (dealerDoc.exists) {
            const dealerData = dealerDoc.data();
            if (dealerData.pin === pin) { // Replace with secure pin comparison
                // Proceed with M-Pesa transaction
                // TODO: Initiate M-Pesa transaction (API call)
                // Example: (Replace with your M-Pesa API call)
                // ... (API call to initiate M-Pesa transaction for 1 token) ...

                // Example transaction log (replace with actual logic)
                const transaction = {
                    userId: selectedUserId,
                    amount: amount,
                    timestamp: new Date(),
                    status: 'pending' // Or 'success'/'failed'
                };

                // Store transaction in IndexedDB
                storeTransaction(transaction);

                // Update UI
                transactionMessage.textContent = `Transaction initiated. User ${selectedUserPhoneNumber} will receive a prompt to enter M-Pesa PIN for 1 token.`;

                // TODO: Update UI after transaction completion (M-Pesa API callback)
                db.collection('users').doc(selectedUserId).update({
                    walletBalance: firebase.firestore.FieldValue.increment(amount * 100) // Add amount in cents
                }).then(() => {
                    transactionMessage.textContent = 'Cash purchase successful!';
                    // Update the displayed balance
                    userBalance.textContent = parseInt(userBalance.textContent) + amount;
                }).catch((error) => {
                    transactionMessage.textContent = 'Cash purchase failed.';
                    console.error('Cash purchase error:', error);
                });

            } else {
                transactionMessage.textContent = 'Invalid dealer PIN.';
            }
        } else {
            transactionMessage.textContent = 'Dealer not found.';
        }
    }).catch((error) => {
        console.error('Dealer PIN verification error:', error);
        transactionMessage.textContent = 'An error occurred during PIN verification.';
    });

});

// IndexedDB functions
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('transactionHistory', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('transactions', { autoIncrement: true });
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function storeTransaction(transaction) {
    const db = await openDatabase();
    const store = db.transaction('transactions', 'readwrite').objectStore('transactions');
    store.add(transaction);
    displayHistory();
}

async function displayHistory() {
    const db = await openDatabase();
    const store = db.transaction('transactions', 'readonly').objectStore('transactions');
    const request = store.openCursor(null, 'prev'); // Display latest transactions first
    historyList.innerHTML = ''; // Clear previous list

    request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const transaction = cursor.value;
            const listItem = document.createElement('li');
            listItem.textContent = `Amount: ${transaction.amount}, Time: ${transaction.timestamp}`;
            historyList.appendChild(listItem);
            cursor.continue();
        }
    };
}

// Display history on page load
displayHistory();