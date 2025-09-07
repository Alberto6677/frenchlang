// FrenchLang - Interpréteur minimal
// ==================================
// Ce fichier est la base de ton interpréteur FrenchLang (.fl)
// Il est conçu pour être **simplement modifiable**, lisible et commenté.

// =====================
// Import des modules
// =====================
const fs = require("fs");
const path = require("path");

// =====================
// Récupérer le fichier à exécuter
// =====================
const fichier = process.argv[2]; // Le premier argument passé à Node.js
if (!fichier) {
  console.error("Usage: node interpreter.js <fichier.fl>");
  process.exit(1);
}

// =====================
// Lecture du fichier
// =====================
let code;
try {
  code = fs.readFileSync(path.resolve(fichier), "utf-8");
} catch (err) {
  console.error("Erreur lors de la lecture du fichier :", err.message);
  process.exit(1);
}

// =====================
// Séparation en lignes
// =====================
const lignes = code.split(/\r?\n/); // Supporte Windows et Linux/Mac

// =====================
// Fonction pour exécuter une ligne
// =====================
function executerLigne(ligne, numero) {
  ligne = ligne.trim(); // Supprime les espaces inutiles

  // Ignorer les lignes vides ou les commentaires
  if (!ligne || ligne.startsWith("#")) return;

  // ---- Commande : console.msg("...") ----
  if (ligne.startsWith("console.msg(")) {
    const contenu = ligne.match(/console\.msg\((.*)\)/)[1];
    console.log(eval(contenu));
  }

  // ---- Commande : console.att("...") ----
  else if (ligne.startsWith("console.att(")) {
    const contenu = ligne.match(/console\.att\((.*)\)/)[1];
    console.warn(eval(contenu));
  }

  // ---- Commande : console.err("...") ----
  else if (ligne.startsWith("console.err(")) {
    const contenu = ligne.match(/console\.err\((.*)\)/)[1];
    console.error(eval(contenu));
  }

  // ---- Commande non reconnue ----
  else {
    console.log(`Ligne ${numero} non reconnue : ${ligne}`);
  }
}

// =====================
// Exécution ligne par ligne
// =====================
lignes.forEach((ligne, index) => {
  executerLigne(ligne, index + 1);
});

// =====================
// Comment éditer / ajouter des commandes
// =====================
// Pour ajouter un nouveau mot-clé FrenchLang, ajoute un nouveau "else if" dans
// la fonction executerLigne. Par exemple :
//
// else if (ligne.startsWith("console.boum(")) {
//     const contenu = ligne.match(/console\.boum\((.*)\)/)[1];
//     console.log("BOUM : " + eval(contenu));
// }
