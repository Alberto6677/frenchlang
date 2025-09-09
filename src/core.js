// FrenchLang - Core logic (Node & Browser compatible)
// ===================================================

function executeFrenchLang(code, consoleFL) {
    // ---------------------
    // Console par défaut
    // ---------------------
    if (!consoleFL) {
        consoleFL = {
            msg: console.log,
            att: console.warn,
            err: console.error
        };
    }

    // ---------------------
    // Stockage des variables
    // ---------------------
    const variables = {};
    const defs = {};

    // ---------------------
    // Fonction utilitaire pour extraire l’argument
    // ---------------------
    function parseArg(ligne, cmd) {
        const regex = new RegExp(`${cmd}\\((.*)\\)`);
        const match = ligne.match(regex);
        return match ? match[1] : "";
    }

    // ---------------------
    // Commandes FrenchLang
    // ---------------------
    const commands = {
        "console.msg": arg => consoleFL.msg(evalArg(arg)),
        "console.att": arg => consoleFL.att(evalArg(arg)),
        "console.err": arg => consoleFL.err(evalArg(arg)),

        // Définir une variable mutable
        "var": arg => {
            const [name, value] = arg.split("=").map(s => s.trim());
            variables[name] = evalArg(value);
        },

        // Définir une constante / fonction
        "def": arg => {
            const [name, value] = arg.split("=").map(s => s.trim());
            if (defs[name] !== undefined) {
                consoleFL.err(`Erreur : def '${name}' est déjà défini !`);
            } else {
                defs[name] = evalArg(value);
            }
        }
    };

    // ---------------------
    // Fonction pour évaluer un argument avec accès aux variables/defs
    // ---------------------
    function evalArg(arg) {
        // Remplacer les noms de variables/defs par leur valeur
        if (variables[arg] !== undefined) return variables[arg];
        if (defs[arg] !== undefined) return defs[arg];
        try {
            return eval(arg); // si c’est du JS valide (ex: "2+2")
        } catch {
            return arg; // sinon on renvoie brut
        }
    }

    // ---------------------
    // Exécution ligne par ligne
    // ---------------------
    const lignes = code.split(/\r?\n/);
    let inComment = false;

    lignes.forEach((ligne, index) => {
        ligne = ligne.trim();

        if (ligne.startsWith("/*")) inComment = true;
        if (inComment) {
            if (ligne.endsWith("*/")) inComment = false;
            return;
        }

        if (!ligne || ligne.startsWith("#")) return;

        let reconnue = false;
        for (const cmd in commands) {
            if (ligne.startsWith(cmd + "(")) {
                const arg = parseArg(ligne, cmd);
                commands[cmd](arg);
                reconnue = true;
                break;
            }
        }

        if (!reconnue) {
            consoleFL.msg(`Ligne ${index + 1} non reconnue : ${ligne}`);
        }
    });
}

// Pour Node.js
if (typeof module !== "undefined" && module.exports) {
    module.exports = executeFrenchLang;
}
