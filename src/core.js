function executeFrenchLang(code, consoleFL) {
    const lignes = code.split(/\r?\n/);
    lignes.forEach((ligne, index) => {
        ligne = ligne.trim();
        if (!ligne || ligne.startsWith("#") || ligne.startsWith("/*")) return;

        if (ligne.startsWith("console.msg(")) {
            consoleFL.msg(eval(ligne.match(/console\.msg\((.*)\)/)[1]));
        } else if (ligne.startsWith("console.att(")) {
            consoleFL.att(eval(ligne.match(/console\.att\((.*)\)/)[1]));
        } else if (ligne.startsWith("console.err(")) {
            consoleFL.err(eval(ligne.match(/console\.err\((.*)\)/)[1]));
        } else {
            consoleFL.msg(`Ligne ${index+1} non reconnue : ${ligne}`);
        }
    });
}

module.exports = executeFrenchLang; // pour Node.js
