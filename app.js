// Configuration par défaut
const DEFAULT_CONFIG = {
  caution: 2.00,
  prix2: 2.00,
  prix4: 4.00
};

// Variable globale pour stocker le solde dû
let soldeDu = 0;

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  // Charger les prix depuis localStorage ou utiliser les valeurs par défaut
  loadConfig();
  
  // Initialiser l'affichage des prix
  majAffichagePrix();
  
  // Enregistrer le service worker pour PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .catch(err => console.log('SW registration failed:', err));
  }
});

// Charger la configuration
function loadConfig() {
  const saved = localStorage.getItem('verrifieur-config');
  if (saved) {
    const config = JSON.parse(saved);
    document.getElementById('prix2').value = config.prix2 || DEFAULT_CONFIG.prix2;
    document.getElementById('prix4').value = config.prix4 || DEFAULT_CONFIG.prix4;
    document.getElementById('caution').value = config.caution || DEFAULT_CONFIG.caution;
  } else {
    document.getElementById('prix2').value = DEFAULT_CONFIG.prix2;
    document.getElementById('prix4').value = DEFAULT_CONFIG.prix4;
    document.getElementById('caution').value = DEFAULT_CONFIG.caution;
  }
}

// Sauvegarder la configuration
function saveConfig() {
  const config = {
    prix2: parseFloat(document.getElementById('prix2').value),
    prix4: parseFloat(document.getElementById('prix4').value),
    caution: parseFloat(document.getElementById('caution').value)
  };
  localStorage.setItem('verrifieur-config', JSON.stringify(config));
}

// Mettre à jour l'affichage des prix
function majAffichagePrix() {
  const prix2 = parseFloat(document.getElementById('prix2').value) || 0;
  const prix4 = parseFloat(document.getElementById('prix4').value) || 0;
  const caution = parseFloat(document.getElementById('caution').value) || 0;

  document.getElementById('prix2E').textContent = prix2.toFixed(2);
  document.getElementById('prix4E').textContent = prix4.toFixed(2);
  document.getElementById('cautionBubble').textContent = 'Caution : ' + caution.toFixed(2) + ' €';
  
  saveConfig();
}

// Écouter les changements de prix
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('prix2').addEventListener('input', majAffichagePrix);
  document.getElementById('prix4').addEventListener('input', majAffichagePrix);
  document.getElementById('caution').addEventListener('input', majAffichagePrix);
});

// Toggle paramètres
function toggleParametres() {
  const params = document.getElementById('parametres');
  const isVisible = params.style.display === 'block';
  params.style.display = isVisible ? 'none' : 'block';
}

// Calculer le solde
function calculerSolde() {
  const nbGobeletsRendus = parseInt(document.getElementById('nombreGobeletsRendus').value) || 0;
  const nbBoissons2E = parseInt(document.getElementById('nombreBoissons2E').value) || 0;
  const nbBoissons4E = parseInt(document.getElementById('nombreBoissons4E').value) || 0;
  const nbEauPlate = parseInt(document.getElementById('nombreEauPlate').value) || 0;

  const prix2 = parseFloat(document.getElementById('prix2').value) || 0;
  const prix4 = parseFloat(document.getElementById('prix4').value) || 0;
  const caution = parseFloat(document.getElementById('caution').value) || 0;

  // Calcul total boissons
  const totalBoissons = (nbBoissons2E * prix2) + (nbBoissons4E * prix4);

  // Total caution due
  const totalCautionDue = caution * (nbBoissons2E + nbBoissons4E + nbEauPlate);

  // Remboursement caution
  const cautionRendue = caution * nbGobeletsRendus;

  // Solde final
  const solde = totalBoissons + totalCautionDue - cautionRendue;

  // Stocker le solde
  soldeDu = solde;

  // Affichage
  const resultat = document.getElementById('resultat');
  let texte, classe;

  if (solde > 0.001) {
    texte = "Le client doit : " + solde.toFixed(2) + " €";
    classe = "result-ok";
    document.getElementById('rendMonnaie').style.display = 'block';
    document.getElementById('montantDonne').value = '0';
    document.getElementById('renduMonnaie').textContent = '';
  } else if (solde < -0.001) {
    texte = "À rendre au client : " + (-solde).toFixed(2) + " €";
    classe = "result-warn";
    document.getElementById('rendMonnaie').style.display = 'none';
  } else {
    texte = "Solde nul";
    classe = "result-neutral";
    document.getElementById('rendMonnaie').style.display = 'none';
  }

  resultat.textContent = texte;
  resultat.className = "result-box " + classe;
}

// Calculer le rendu de monnaie
function calculerRenduMonnaie() {
  const montantDonne = parseFloat(document.getElementById('montantDonne').value) || 0;
  const renduMonnaie = document.getElementById('renduMonnaie');

  if (montantDonne === 0) {
    renduMonnaie.textContent = '';
    return;
  }

  const difference = montantDonne - soldeDu;

  if (difference > 0.001) {
    renduMonnaie.textContent = "À rendre : " + difference.toFixed(2) + " €";
    renduMonnaie.style.color = "#ffa500";
  } else if (difference < -0.001) {
    renduMonnaie.textContent = "Manque : " + (-difference).toFixed(2) + " €";
    renduMonnaie.style.color = "#f44";
  } else {
    renduMonnaie.textContent = "Montant exact ✓";
    renduMonnaie.style.color = "#4caf50";
  }
}

// Définir un montant rapide
function setMontant(montant) {
  document.getElementById('montantDonne').value = montant;
  calculerRenduMonnaie();
}

// Nouveau client (reset uniquement les quantités)
function nouveauClient() {
  document.getElementById('nombreGobeletsRendus').value = '0';
  document.getElementById('nombreBoissons2E').value = '0';
  document.getElementById('nombreBoissons4E').value = '0';
  document.getElementById('nombreEauPlate').value = '0';

  const resultat = document.getElementById('resultat');
  resultat.textContent = '';
  resultat.className = 'result-box';

  document.getElementById('rendMonnaie').style.display = 'none';
  document.getElementById('montantDonne').value = '0';
  document.getElementById('renduMonnaie').textContent = '';

  soldeDu = 0;
}

// Reset complet (quantités + prix par défaut)
function resetForm() {
  nouveauClient();
  
  document.getElementById('prix2').value = DEFAULT_CONFIG.prix2.toFixed(2);
  document.getElementById('prix4').value = DEFAULT_CONFIG.prix4.toFixed(2);
  document.getElementById('caution').value = DEFAULT_CONFIG.caution.toFixed(2);

  majAffichagePrix();
}