// FrenchLang - Core logic (Node & Browser compatible)
// ===================================================
// Interpréteur de FrenchLang (.fl) simple, lisible et facilement modifiable

function executeFrenchLang(code, consoleFL) {
    // ---------------------
    // Configuration console par défaut
    // ---------------------
    if (!consoleFL) {
        consoleFL = {
            msg: console.log,
            att: console.warn,
            err: console.error
        };
    }

    // ---------------------
    // Fonction utilitaire pour extraire l’argument d’une commande
    // ---------------------
    function parseArg(ligne, cmd) {
        const regex = new RegExp(`${cmd}\\((.*)\\)`);
        const match = ligne.match(regex);
        return match ? match[1] : "";
    }

    // ---------------------
    // Définition des commandes FrenchLang
    // Pour ajouter une commande : ajouter une nouvelle clé dans cet objet
    // Exemple : "console.boum": arg => consoleFL.msg("BOUM : " + eval(arg))
    // ---------------------
    const commands = {
        "console.msg": arg => consoleFL.msg(eval(arg)),
        "console.att": arg => consoleFL.att(eval(arg)),
        "console.err": arg => consoleFL.err(eval(arg))
    };

    // ---------------------
    // Exécution ligne par ligne
    // ---------------------
    const lignes = code.split(/\r?\n/);

    lignes.forEach((ligne, index) => {
        ligne = ligne.trim();

        // Ignorer lignes vides ou commentaires
        if (!ligne || ligne.startsWith("#") || ligne.startsWith("/*")) return;

        // Chercher quelle commande correspond
        let reconnue = false;
        for (const cmd in commands) {
            if (ligne.startsWith(cmd + "(")) {
                const arg = parseArg(ligne, cmd);
                commands[cmd](arg);
                reconnue = true;
                break;
            }
        }

        // Commande non reconnue
        if (!reconnue) {
            consoleFL.msg(`Ligne ${index + 1} non reconnue : ${ligne}`);
        }
    });
}

// Pour Node.js
if (typeof module !== "undefined" && module.exports) {
    module.exports = executeFrenchLang;
}
