// login.js (sécurisé)
const BASE_URL = "http://localhost:5678/api/";
const USERS_API = BASE_URL + "users/login";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("login_error");

function showError(msg){ if(!errorBox) return; errorBox.textContent = msg; errorBox.style.display = "block"; }
function clearError(){ if(!errorBox) return; errorBox.textContent = ""; errorBox.style.display = "none"; }

async function loginUser(email, password){
  try{
    const res = await fetch(USERS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({ email, password })
    });
    if(!res.ok){
      let msg = "E-mail ou mot de passe incorrect";
      try{ const j = await res.json(); if(j?.message) msg = j.message; }catch{}
      showError(msg);
      return;
    }
    const data = await res.json();
    if(data?.token){
      sessionStorage.setItem("token", data.token);
      window.location.href = "index.html";
    }else{
      showError("Réponse inattendue du serveur.");
    }
  }catch{
    showError("Impossible de contacter le serveur.");
  }
}

// n’attache le listener que si on est sur la page login
if(form && emailInput && passwordInput){
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearError();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if(!email || !password){
      showError("Veuillez saisir votre e-mail et votre mot de passe.");
      return;
    }
    loginUser(email, password);
  });
}
