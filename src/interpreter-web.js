// FrenchLang - Interpréteur minimal (Browser compatible)
// =======================================================
// Ce fichier est la base de ton interpréteur FrenchLang (.fl)
// Il est conçu pour être simple, lisible et modifiable.

// =====================
// Fonction principale pour exécuter du code FrenchLang
// =====================
function executeFrenchLang(code, consoleFL = null) {
    // Si consoleFL n'est pas fourni, utiliser console par défaut
    if (!consoleFL) {
        consoleFL = {
            msg: console.log,
            att: console.warn,
            err: console.error
        };
    }

    // Séparation en lignes
    const lignes = code.split(/\r?\n/); // Supporte Windows et Linux/Mac

    // Fonction pour exécuter une ligne
    function executerLigne(ligne, numero) {
        ligne = ligne.trim(); // Supprime les espaces inutiles

        // Ignorer les lignes vides ou les commentaires
        if (!ligne || ligne.startsWith("#") || ligne.startsWith("/*")) return;

        // ---- Commande : console.msg("...") ----
        if (ligne.startsWith("console.msg(")) {
            const contenu = ligne.match(/console\.msg\((.*)\)/)[1];
            consoleFL.msg(eval(contenu));
        }

        // ---- Commande : console.att("...") ----
        else if (ligne.startsWith("console.att(")) {
            const contenu = ligne.match(/console\.att\((.*)\)/)[1];
            consoleFL.att(eval(contenu));
        }

        // ---- Commande : console.err("...") ----
        else if (ligne.startsWith("console.err(")) {
            const contenu = ligne.match(/console\.err\((.*)\)/)[1];
            consoleFL.err(eval(contenu));
        }

        // ---- Commande non reconnue ----
        else {
            consoleFL.msg(`Ligne ${numero} non reconnue : ${ligne}`);
        }
    }

    // Exécution ligne par ligne
    lignes.forEach((ligne, index) => {
        executerLigne(ligne, index + 1);
    });
}

// =====================
// Comment éditer / ajouter des commandes
// =====================
// Pour ajouter un nouveau mot-clé FrenchLang, ajoute un nouveau "else if" dans
// la fonction executerLigne. Par exemple :
//
// else if (ligne.startsWith("console.boum(")) {
//     const contenu = ligne.match(/console\.boum\((.*)\)/)[1];
//     consoleFL.msg("BOUM : " + eval(contenu));
// }
