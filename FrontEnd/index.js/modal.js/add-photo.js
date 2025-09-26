// add-photo.js — isolé, compatible avec la structure d'origine
(function () {
  // DOM (présents dans la page)
  const NEW_MODALE           = document.querySelector(".modal-new-photo");
  const BUTTON_CLOSE_NEW     = document.querySelector(".js-modal-close-new");
  const BUTTON_BACK          = document.querySelector(".modal-back");
  const BUTTON_ADD           = document.querySelector(".button-add-photo");
  const INPUT_PICTURE        = document.querySelector("#input-picture");
  const PICTURE_PREVIEW      = document.querySelector("#picture-preview");
  const PICTURE_SELECTION    = document.querySelector(".picture-selection");
  const CATEGORIES_SELECT    = document.querySelector(".select-category");
  const TITLE_NEW_PHOTO      = document.querySelector(".input-titre");
  const BUTTON_SUBMIT        = document.querySelector(".button-submit");

  let modal_new = null;
  let escHandlerNew = null;

  // Endpoints (isolés dans l'IIFE)
  const API_BASE        = "http://localhost:5678/api/";
  const WORKS_API       = API_BASE + "works";
  const CATEGORIES_API  = API_BASE + "categories";

  // --- OUVERTURE ---
  const OPEN_MODAL_NEW = function (e) {
    e.preventDefault();

    // cacher modal1 (galerie)
    if (window.modal) {
      window.modal.style.display = "none";
      const wrap1 = window.modal.querySelector(".modal-wrapper");
      if (wrap1) wrap1.style.display = "none";
    }

    // afficher modal2 (ajout)
    modal_new = document.querySelector("#modal2");
    if (!modal_new) return;

    const wrap2 = modal_new.querySelector(".modal-wrapper-new");
    modal_new.style.display = "";
    if (wrap2) wrap2.style.display = "flex";
    document.body.style.overflow = "hidden";

    // listeners fermeture
    modal_new.addEventListener("click", CLOSE_MODAL_NEW);
    if (BUTTON_CLOSE_NEW) BUTTON_CLOSE_NEW.addEventListener("click", CLOSE_MODAL_NEW);
    escHandlerNew = (ev) => { if (ev.key === "Escape") CLOSE_MODAL_NEW(ev); };
    document.addEventListener("keydown", escHandlerNew);

    // reset UI + data
    resetPhotoSelection();
    resetForm();
    loadCategories();

    updateSubmitState();
  };

  // --- FERMETURE ---
  const CLOSE_MODAL_NEW = function (e) {
    if (!modal_new) return;

    if (e && e.type === "click") {
      const isOverlay  = e.target === modal_new;
      const isCloseBtn = e.target === BUTTON_CLOSE_NEW || e.target.closest?.(".js-modal-close-new");
      const isXIcon    = e.target.classList?.contains("fa-x");
      if (!(isOverlay || isCloseBtn || isXIcon)) return;
      e.preventDefault();
    }

    const wrap2 = modal_new.querySelector(".modal-wrapper-new");
    modal_new.style.display = "none";
    if (wrap2) wrap2.style.display = "none";
    document.body.style.overflow = "";

    modal_new.removeEventListener("click", CLOSE_MODAL_NEW);
    if (BUTTON_CLOSE_NEW) BUTTON_CLOSE_NEW.removeEventListener("click", CLOSE_MODAL_NEW);
    if (escHandlerNew) document.removeEventListener("keydown", escHandlerNew);
    escHandlerNew = null;
    modal_new = null;
  };

  // --- RETOUR → modal1 (galerie) ---
  if (BUTTON_BACK) {
    BUTTON_BACK.addEventListener("click", function (e) {
      e.preventDefault();
      if (!modal_new) return;

      const wrap2 = modal_new.querySelector(".modal-wrapper-new");
      modal_new.style.display = "none";
      if (wrap2) wrap2.style.display = "none";

      // ré-afficher modal1
      const m1 = document.getElementById("modal1");
      if (m1) {
        m1.style.display = "block";
        const wrap1 = m1.querySelector(".modal-wrapper");
        if (wrap1) wrap1.style.display = "flex";
      }
    });
  }

  // --- BOUTON "Ajouter photo" -> input file ---
  if (BUTTON_ADD) {
    BUTTON_ADD.addEventListener("click", function (e) {
      e.preventDefault();
      INPUT_PICTURE?.click();
    });
  }

  // --- Sélection / preview / validation ---
  if (INPUT_PICTURE) {
    INPUT_PICTURE.addEventListener("change", function () {
      const f = this.files?.[0];
      if (!f) { resetPhotoSelection(); updateSubmitState(); return; }

      const isImage = /^image\/(jpeg|jpg|png)$/i.test(f.type);
      const tooBig  = f.size > 4 * 1024 * 1024;

      if (!isImage || tooBig) {
        alert("Format ou taille invalide (jpg/png, 4 Mo max).");
        this.value = "";
        resetPhotoSelection();
      } else {
        PICTURE_PREVIEW.src = URL.createObjectURL(f);
        PICTURE_PREVIEW.style.display = "block";
        PICTURE_SELECTION && (PICTURE_SELECTION.style.display = "none");
      }
      updateSubmitState();
    });
  }

  // --- Helpers UI ---
  function resetPhotoSelection() {
    if (INPUT_PICTURE) INPUT_PICTURE.value = "";
    if (PICTURE_PREVIEW) {
      PICTURE_PREVIEW.src = "";
      PICTURE_PREVIEW.style.display = "none";
    }
    if (PICTURE_SELECTION) PICTURE_SELECTION.style.display = "block";
  }
  function resetForm() {
    if (CATEGORIES_SELECT) CATEGORIES_SELECT.value = "0";
    if (TITLE_NEW_PHOTO) TITLE_NEW_PHOTO.value = "";
  }
  function updateSubmitState() {
    const fileOk  = !!(INPUT_PICTURE?.files?.[0]);
    const titleOk = !!(TITLE_NEW_PHOTO?.value.trim());
    const catOk   = !!(CATEGORIES_SELECT?.value && CATEGORIES_SELECT.value !== "0");
    const ok = fileOk && titleOk && catOk;

    if (BUTTON_SUBMIT) {
      BUTTON_SUBMIT.disabled = !ok;
      BUTTON_SUBMIT.style.backgroundColor = ok ? "#1D6154" : "#A7A7A7";
      BUTTON_SUBMIT.style.cursor = ok ? "pointer" : "default";
      BUTTON_SUBMIT.removeEventListener("click", onSubmitClick);
      if (ok) BUTTON_SUBMIT.addEventListener("click", onSubmitClick);
    }
  }

  // --- Catégories ---
  function loadCategories() {
    if (!CATEGORIES_SELECT) return;
    CATEGORIES_SELECT.innerHTML = "";

    const opt0 = document.createElement("option");
    opt0.value = "0"; opt0.textContent = "";
    CATEGORIES_SELECT.add(opt0);

    fetch(CATEGORIES_API)
      .then(r => r.json())
      .then(cats => {
        cats.forEach(c => {
          const opt = document.createElement("option");
          opt.value = c.id; opt.textContent = c.name;
          CATEGORIES_SELECT.add(opt);
        });
      })
      .catch(() => {});
  }

  // --- Submit (POST /works) ---
  function onSubmitClick(e) {
    e.preventDefault();

    const token = sessionStorage.getItem("token");
    if (!token) { alert("Session expirée ou invalide."); return; }

    const file  = INPUT_PICTURE?.files?.[0];
    const title = TITLE_NEW_PHOTO?.value.trim();
    const catId = CATEGORIES_SELECT?.value;

    if (!file || !title || !catId || catId === "0") {
      updateSubmitState();
      return;
    }

    const fd = new FormData();
    fd.append("image", file);
    fd.append("title", title);
    fd.append("category", catId);

    fetch(WORKS_API, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Accept": "*/*" },
      body: fd
    })
      .then(res => {
        if (res.status === 200 || res.status === 201) return true;
        if (res.status === 401) throw new Error("401");
        throw new Error("KO");
      })
      .then(() => {
        resetPhotoSelection();
        resetForm();
        updateSubmitState();

        // refresh modale + accueil
        const modalGallery = document.querySelector(".modal-gallery");
        if (typeof window.refreshWorks === "function") {
          if (modalGallery) window.refreshWorks(modalGallery, true);
          if (window.GALLERY_DIV) window.refreshWorks(window.GALLERY_DIV, false);
        } else if (typeof window.resetToAllAndRefresh === "function") {
          window.resetToAllAndRefresh();
        } else {
          location.reload();
        }
      })
      .catch(err => {
        if (String(err.message) === "401") alert("Session expirée ou invalide");
        else alert("Échec de l’ajout. Vérifiez les champs.");
      });
  }

  // --- vérif à la volée ---
  CATEGORIES_SELECT?.addEventListener("change", updateSubmitState);
  TITLE_NEW_PHOTO?.addEventListener("input", updateSubmitState);

  // --- ouverture depuis "Ajouter une photo" (modale 1) ---
  document.querySelectorAll("#ajout_projet").forEach(a => {
    a.addEventListener("click", OPEN_MODAL_NEW);
  });
})();
