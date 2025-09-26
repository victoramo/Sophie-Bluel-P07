// auth.js
(function(){
  const token = sessionStorage.getItem("token");

  const edition = document.getElementById("edition");
  const loginLogoutLink =   
                            document.getElementById("login_logout") ||
                            document.getElementById("loginLink");   // ← accepte les deux
  const modifProjet = document.getElementById("modif_projet");
  const filterDiv = document.querySelector(".filter");

  if(token){
    // UI "connecté"
    if(edition) edition.style.display = "block";
    document.body.classList.add("banner-on");
    if(modifProjet) modifProjet.style.display = "inline";
    if(filterDiv) filterDiv.style.display = "none";
    if(loginLogoutLink){
      loginLogoutLink.textContent = "logout";
      loginLogoutLink.href = "#";
      loginLogoutLink.addEventListener("click", (e)=>{
        e.preventDefault();
        sessionStorage.removeItem("token");
        window.location.href = "index.html";
      });
    }
  }else{
    // UI "visiteur"
    if(edition) edition.style.display = "none";
    document.body.classList.remove("banner-on");
    if(modifProjet) modifProjet.style.display = "none";
    if(filterDiv) filterDiv.style.display = "flex";
    if(loginLogoutLink){
      loginLogoutLink.textContent = "login";
      loginLogoutLink.href = "login.html";
    }
  }
})();
