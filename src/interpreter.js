const fs = require("fs");
const path = require("path");
const executeFrenchLang = require("./core");

const fichier = process.argv[2];
if (!fichier) {
    console.error("Usage: node interpreter-node.js <fichier.fl>");
    process.exit(1);
}

let code;
try {
    code = fs.readFileSync(path.resolve(fichier), "utf-8");
} catch (err) {
    console.error("Erreur lors de la lecture du fichier :", err.message);
    process.exit(1);
}

// Exécuter le code avec les logs Node
executeFrenchLang(code, {
    msg: console.log,
    att: console.warn,
    err: console.error
});
