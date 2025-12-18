// Import the functions you need from the SDKs you need
  
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
    import { getDatabase, ref, get, set, push, update } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
  
    // TODO: Add SDKs for Firebase products that you want to use
  
    // https://firebase.google.com/docs/web/setup#available-libraries
  
  
    // Your web app's Firebase configuration
  
    const firebaseConfig = {
      apiKey: "AIzaSyDK72PFx0q0sgHILWwpzXFzfKzCuZI31M8",
      authDomain: "pump-pals-8fcd1.firebaseapp.com",
      projectId: "pump-pals-8fcd1",
      storageBucket: "pump-pals-8fcd1.firebasestorage.app",
      messagingSenderId: "133060959480",
      appId: "1:133060959480:web:9827c5bf984022de0b2f0d"
    };
  
  
    // Initialize Firebase
  
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app)
    const dbRef = ref(database);

    export { app, database, ref, dbRef, push, update, get, set };