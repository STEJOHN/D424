import {
  getAuth,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { j } from "./firebase-config.js";

const app = initializeApp(j);
const auth = getAuth(app);

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      console.log("User signed out");
      window.location.href = "login-page.html";
    })
    .catch((error) => {
      console.error("Error signing out:", error);
    });
});
