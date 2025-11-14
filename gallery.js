const BASE_URL = "http://localhost:5678/api/";
const WORKS_API = BASE_URL + "works";
const CATEGORY_API = BASE_URL + "categories";
const GALLERY_DIV = document.querySelector(".gallery");
const FILTER_DIV = document.querySelector(".filter");

fetchWorks(GALLERY_DIV, false);

function refreshWorks(targetDiv, deleteButton) {
  targetDiv.innerHTML = '';
  fetchWorks(targetDiv, deleteButton);
}

function fetchWorks(targetDiv, deleteButton) {
  fetch(WORKS_API)
    .then(response => response.json())
    .then(works => {
      workList = works;
      for (let i = 0; i < works.length; i++) {
        createWork(works[i], targetDiv, deleteButton);
      }
    });
}

function createWork(work, targetDiv, deleteButton) {
  const figure = document.createElement("figure");
  const imgWorks = document.createElement("img");
  const figcaption = document.createElement("figcaption");

  imgWorks.src = work.imageUrl;
  figcaption.innerHTML = work.title;

  figure.appendChild(imgWorks);
  figure.appendChild(figcaption);
  targetDiv.appendChild(figure);

  if (deleteButton) {
    createDeleteButton(figure, work);
  }
}

fetch(CATEGORY_API)
  .then(response => response.json())
  .then(categories => {
    const filterWorks = new Set(categories);
    const nouvelleCategorie = { id: 0, name: "Tous" };

    createFilterButton(nouvelleCategorie);
    addSelectedClass(nouvelleCategorie.id);

    for (const category of filterWorks) {
      createFilterButton(category);
    }
  });

function createFilterButton(category) {
  const categoryLink = document.createElement("a");
  categoryLink.id = "category" + category.id;
  categoryLink.classList.add("category");
  categoryLink.innerHTML = category.name;
  FILTER_DIV.appendChild(categoryLink);

  categoryLink.addEventListener("click", function () {
    filterWorksByCategory(category.id);
  });
}

function filterWorksByCategory(categoryId) {
  GALLERY_DIV.innerHTML = '';

  for (let i = 0; i < workList.length; i++) {
    if (workList[i].categoryId === categoryId || categoryId === 0) {
      createWork(workList[i], GALLERY_DIV, false);
    }
  }

  removeSelectedClass();
  addSelectedClass(categoryId);
}

gestion_login();

function createDeleteButton(figure, work) {
  const button = document.createElement('i');
  button.classList.add("fa-regular", "fa-trash-can");
  button.addEventListener('click', DELETE_WORK);
  button.id = work.id;
  figure.appendChild(button);
}

function addSelectedClass(categoryId) {
  document.getElementById("category" + categoryId).classList.add("selected");
}

function removeSelectedClass() {
  const filters = document.querySelectorAll(".category");
  for (let i = 0; i < filters.length; i++) {
    filters[i].classList.remove("selected");
  }
}

function gestion_login() {
  if (sessionStorage.getItem("token")) {
    const loginLogoutLink = document.getElementById("login_logout");
    loginLogoutLink.textContent = "logout";

    const bandeau_edit = document.getElementById("edition");
    bandeau_edit.style.display = "flex";

    const projet_modif = document.getElementById("modif_projet");
    projet_modif.style.display = "inline";

    const button_filter = document.querySelector(".filter");
    button_filter.style.display = "none";

    loginLogoutLink.addEventListener("click", function (event) {
      event.preventDefault();
      sessionStorage.removeItem("token");
      window.location.href = "index.html";
    });
  }
}