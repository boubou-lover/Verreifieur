// Récupération des éléments DOM
const prix2 = document.getElementById("prix2");
const prix4 = document.getElementById("prix4");
const caution = document.getElementById("caution");

const prix2E = document.getElementById("prix2E");
const prix4E = document.getElementById("prix4E");
const cautionBubble = document.getElementById("cautionBubble");

const nombreBoissons2E = document.getElementById("nombreBoissons2E");
const nombreBoissons4E = document.getElementById("nombreBoissons4E");
const nombreEauPlate = document.getElementById("nombreEauPlate");
const nombreGobeletsRendus = document.getElementById("nombreGobeletsRendus");

const resultat = document.getElementById("resultat");
const rendMonnaie = document.getElementById("rendMonnaie");
const montantDonne = document.getElementById("montantDonne");
const renduMonnaie = document.getElementById("renduMonnaie");

const parametres = document.getElementById("parametres");

let soldeDu = 0;
let paramsLocked = true;

/* PARAMÈTRES */
function sauvegarderParametres() {
  localStorage.setItem("verrifieur-parametres", JSON.stringify({
    prix2: prix2.value,
    prix4: prix4.value,
    caution: caution.value
  }));
}

function chargerParametres() {
  const data = JSON.parse(localStorage.getItem("verrifieur-parametres"));
  if (!data) return;
  prix2.value = data.prix2;
  prix4.value = data.prix4;
  caution.value = data.caution;
  majAffichagePrix();
}

function majAffichagePrix() {
  prix2E.textContent = (+prix2.value).toFixed(2);
  prix4E.textContent = (+prix4.value).toFixed(2);
  cautionBubble.textContent = "Caution : " + (+caution.value).toFixed(2) + " €";
}

function toggleLock() {
  if (paramsLocked) {
    if (prompt("Code ?") !== "1234") return;
  }
  paramsLocked = !paramsLocked;
  parametres.style.display = paramsLocked ? "none" : "block";
}

/* CALCUL */
function calculerSolde() {
  const totalBoissons =
    nombreBoissons2E.value * prix2.value +
    nombreBoissons4E.value * prix4.value;

  const totalCaution =
    ( +nombreBoissons2E.value +
      +nombreBoissons4E.value +
      +nombreEauPlate.value ) * caution.value;

  const rendu = nombreGobeletsRendus.value * caution.value;

  soldeDu = totalBoissons + totalCaution - rendu;

  resultat.className = "result-box";

  if (soldeDu > 0) {
    resultat.textContent = `Client doit ${soldeDu.toFixed(2)} €`;
    resultat.classList.add("result-ok");
    rendMonnaie.style.display = "block";
  } else if (soldeDu < 0) {
    resultat.textContent = `À rendre ${(-soldeDu).toFixed(2)} €`;
    resultat.classList.add("result-warn");
    rendMonnaie.style.display = "none";
  } else {
    resultat.textContent = "Solde nul";
    resultat.classList.add("result-neutral");
    rendMonnaie.style.display = "none";
  }
}

function calculerRenduMonnaie() {
  const diff = montantDonne.value - soldeDu;
  renduMonnaie.textContent =
    diff > 0 ? `Rendre ${diff.toFixed(2)} €` :
    diff < 0 ? `Manque ${(-diff).toFixed(2)} €` :
    "Montant exact ✓";
}

function nouveauClient() {
  document.querySelectorAll("input[type=number]").forEach(i => i.value = 0);
  resultat.textContent = "";
  rendMonnaie.style.display = "none";
}

function resetForm() {
  localStorage.removeItem("verrifieur-parametres");
  location.reload();
}

/* INIT */
prix2.oninput = prix4.oninput = caution.oninput = () => {
  majAffichagePrix();
  sauvegarderParametres();
};

chargerParametres();
majAffichagePrix();
