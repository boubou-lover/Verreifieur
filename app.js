// Configuration par défaut
const DEFAULT_CONFIG = {
  caution: 2.00,
  prix2: 2.00,
  prix4: 4.00,
  produits: [
    { nom: '', prix: 0.00, caution: false },
    { nom: '', prix: 0.00, caution: false },
    { nom: '', prix: 0.00, caution: false }
  ]
};

// Variable globale pour stocker le solde dû
let soldeDu = 0;

// Retirer le zéro au focus
function clearZero(input) {
  if (input.value === '0' || input.value === '0.00') {
    input.value = '';
  }
}

// Remettre le zéro si vide au blur
function resetToZero(input) {
  if (input.value === '' || input.value === null) {
    input.value = '0';
  }
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  majAffichagePrix();
  majProduitsSupplementaires();
  displayVersion();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .catch(err => console.log('SW registration failed:', err));
  }

  document.getElementById('prix2').addEventListener('input', majAffichagePrix);
  document.getElementById('prix4').addEventListener('input', majAffichagePrix);
  document.getElementById('caution').addEventListener('input', () => {
    majAffichagePrix();
    majProduitsSupplementaires(); // rafraîchit les tags caution
  });
});

// Afficher la version
async function displayVersion() {
  try {
    const response = await fetch('/service-worker.js');
    const text = await response.text();
    const match = text.match(/CACHE_NAME\s*=\s*["']verrifieur-v([\d.]+)["']/);
    document.getElementById('app-version').textContent = (match && match[1]) ? match[1] : '1.0.1';
  } catch {
    document.getElementById('app-version').textContent = '1.0.1';
  }
}

// Charger la configuration
function loadConfig() {
  const saved = localStorage.getItem('verrifieur-config');
  if (saved) {
    const config = JSON.parse(saved);
    document.getElementById('prix2').value = config.prix2 ?? DEFAULT_CONFIG.prix2;
    document.getElementById('prix4').value = config.prix4 ?? DEFAULT_CONFIG.prix4;
    document.getElementById('caution').value = config.caution ?? DEFAULT_CONFIG.caution;

    const produits = config.produits ?? DEFAULT_CONFIG.produits;
    for (let i = 0; i < 3; i++) {
      const p = produits[i] ?? { nom: '', prix: 0.00, caution: false };
      document.getElementById(`nomProduit${i}`).value = p.nom ?? '';
      document.getElementById(`prixProduitConfig${i}`).value = p.prix ?? '0.00';
      document.getElementById(`cautionProduit${i}`).checked = p.caution ?? false;
    }
  } else {
    document.getElementById('prix2').value = DEFAULT_CONFIG.prix2;
    document.getElementById('prix4').value = DEFAULT_CONFIG.prix4;
    document.getElementById('caution').value = DEFAULT_CONFIG.caution;
    for (let i = 0; i < 3; i++) {
      document.getElementById(`nomProduit${i}`).value = '';
      document.getElementById(`prixProduitConfig${i}`).value = '0.00';
      document.getElementById(`cautionProduit${i}`).checked = false;
    }
  }
}

// Sauvegarder la configuration
function saveConfig() {
  const produits = [];
  for (let i = 0; i < 3; i++) {
    produits.push({
      nom: document.getElementById(`nomProduit${i}`).value.trim(),
      prix: parseFloat(document.getElementById(`prixProduitConfig${i}`).value) || 0,
      caution: document.getElementById(`cautionProduit${i}`).checked
    });
  }

  const config = {
    prix2: parseFloat(document.getElementById('prix2').value),
    prix4: parseFloat(document.getElementById('prix4').value),
    caution: parseFloat(document.getElementById('caution').value),
    produits
  };
  localStorage.setItem('verrifieur-config', JSON.stringify(config));
}

// Mettre à jour l'affichage des prix principaux
function majAffichagePrix() {
  const prix2 = parseFloat(document.getElementById('prix2').value) || 0;
  const prix4 = parseFloat(document.getElementById('prix4').value) || 0;
  const caution = parseFloat(document.getElementById('caution').value) || 0;

  document.getElementById('prix2E').textContent = prix2.toFixed(2);
  document.getElementById('prix4E').textContent = prix4.toFixed(2);
  document.getElementById('cautionBubble').textContent = 'Caution : ' + caution.toFixed(2) + ' €';

  saveConfig();
}

// Mettre à jour les produits supplémentaires
function majProduitsSupplementaires() {
  const cautionGlobale = parseFloat(document.getElementById('caution').value) || 0;

  for (let i = 0; i < 3; i++) {
    const nom = document.getElementById(`nomProduit${i}`).value.trim();
    const prix = parseFloat(document.getElementById(`prixProduitConfig${i}`).value) || 0;
    const avecCaution = document.getElementById(`cautionProduit${i}`).checked;
    const group = document.getElementById(`produitGroup${i}`);

    if (nom !== '') {
      document.getElementById(`nomProduit${i}Label`).textContent = nom;
      document.getElementById(`prixProduit${i}Label`).textContent = prix.toFixed(2);

      const tagEl = document.getElementById(`cautionProduit${i}Tag`);
      if (avecCaution) {
        tagEl.textContent = `+ ${cautionGlobale.toFixed(2)} € caution`;
        tagEl.style.display = 'inline';
      } else {
        tagEl.textContent = '';
        tagEl.style.display = 'none';
      }

      group.style.display = 'flex';
    } else {
      group.style.display = 'none';
      document.getElementById(`nombreProduit${i}`).value = '0';
    }
  }

  saveConfig();
}

// Toggle paramètres
function toggleParametres() {
  const params = document.getElementById('parametres');
  const isVisible = params.style.display === 'block';
  params.style.display = isVisible ? 'none' : 'block';
}

// Vibration
function vibrate(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

// Calculer le solde
function calculerSolde() {
  const nbGobeletsRendus = parseInt(document.getElementById('nombreGobeletsRendus').value) || 0;
  const nbBoissons2E    = parseInt(document.getElementById('nombreBoissons2E').value) || 0;
  const nbBoissons4E    = parseInt(document.getElementById('nombreBoissons4E').value) || 0;
  const nbEauPlate      = parseInt(document.getElementById('nombreEauPlate').value) || 0;

  const prix2   = parseFloat(document.getElementById('prix2').value) || 0;
  const prix4   = parseFloat(document.getElementById('prix4').value) || 0;
  const caution = parseFloat(document.getElementById('caution').value) || 0;

  // Boissons principales
  const totalBoissons = (nbBoissons2E * prix2) + (nbBoissons4E * prix4);

  // Caution boissons principales + eau plate (toujours avec caution)
  const nbAvecCautionPrincipaux = nbBoissons2E + nbBoissons4E + nbEauPlate;
  let totalCautionDue = caution * nbAvecCautionPrincipaux;

  // Produits supplémentaires
  let totalProduitsSupp = 0;
  for (let i = 0; i < 3; i++) {
    const nom = document.getElementById(`nomProduit${i}`).value.trim();
    if (nom === '') continue;

    const nb          = parseInt(document.getElementById(`nombreProduit${i}`).value) || 0;
    const prix        = parseFloat(document.getElementById(`prixProduitConfig${i}`).value) || 0;
    const avecCaution = document.getElementById(`cautionProduit${i}`).checked;

    totalProduitsSupp += nb * prix;
    if (avecCaution) {
      totalCautionDue += nb * caution;
    }
  }

  // Remboursement caution gobelets rendus
  const cautionRendue = caution * nbGobeletsRendus;

  // Solde final
  const solde = totalBoissons + totalProduitsSupp + totalCautionDue - cautionRendue;
  soldeDu = solde;

  vibrate(50);

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
    texte = "Solde nul ✓";
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
  vibrate(30);
  document.getElementById('montantDonne').value = montant;
  calculerRenduMonnaie();
}

// Nouveau client (reset quantités uniquement)
function nouveauClient() {
  vibrate(30);

  document.getElementById('nombreGobeletsRendus').value = '0';
  document.getElementById('nombreBoissons2E').value = '0';
  document.getElementById('nombreBoissons4E').value = '0';
  document.getElementById('nombreEauPlate').value = '0';
  for (let i = 0; i < 3; i++) {
    document.getElementById(`nombreProduit${i}`).value = '0';
  }

  const resultat = document.getElementById('resultat');
  resultat.textContent = '';
  resultat.className = 'result-box';

  document.getElementById('rendMonnaie').style.display = 'none';
  document.getElementById('montantDonne').value = '0';
  document.getElementById('renduMonnaie').textContent = '';

  soldeDu = 0;
}

// Reset complet
function resetForm() {
  nouveauClient();

  document.getElementById('prix2').value = DEFAULT_CONFIG.prix2.toFixed(2);
  document.getElementById('prix4').value = DEFAULT_CONFIG.prix4.toFixed(2);
  document.getElementById('caution').value = DEFAULT_CONFIG.caution.toFixed(2);

  for (let i = 0; i < 3; i++) {
    document.getElementById(`nomProduit${i}`).value = '';
    document.getElementById(`prixProduitConfig${i}`).value = '0.00';
    document.getElementById(`cautionProduit${i}`).checked = false;
  }

  majAffichagePrix();
  majProduitsSupplementaires();
}
