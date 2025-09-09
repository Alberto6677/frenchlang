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
    // Stockage des variables / defs
    // ---------------------
    const variables = {};
    const defs = {};

    // ---------------------
    // Utils : parseArg (récupère le contenu entre parenthèses)
    // ---------------------
    function parseArg(ligne, cmd) {
        const regex = new RegExp(`${cmd}\\((.*)\\)`);
        const match = ligne.match(regex);
        return match ? match[1] : "";
    }

    // ---------------------
    // Utils : splitArgs - découpe une chaîne par virgule MAIS
    // en ignorant les virgules qui sont à l'intérieur de guillemets
    // ou à l'intérieur de parenthèses imbriquées.
    // ---------------------
    function splitArgs(s) {
        const parts = [];
        let cur = "";
        let inSingle = false;
        let inDouble = false;
        let depth = 0;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            const prev = s[i - 1];

            if (ch === "'" && !inDouble && prev !== "\\") {
                inSingle = !inSingle;
                cur += ch;
                continue;
            }
            if (ch === '"' && !inSingle && prev !== "\\") {
                inDouble = !inDouble;
                cur += ch;
                continue;
            }

            if (!inSingle && !inDouble) {
                if (ch === "(") {
                    depth++;
                    cur += ch;
                    continue;
                } else if (ch === ")") {
                    depth = Math.max(0, depth - 1);
                    cur += ch;
                    continue;
                } else if (ch === "," && depth === 0) {
                    parts.push(cur.trim());
                    cur = "";
                    continue;
                }
            }

            cur += ch;
        }
        if (cur.trim() !== "") parts.push(cur.trim());
        return parts;
    }

    // ---------------------
    // Evaluer un argument : variable, def, expression JS, ou littéral
    // ---------------------
    function evalArg(arg) {
        arg = (arg || "").trim();
        if (arg === "") return "";

        // variable name exactly
        if (variables.hasOwnProperty(arg)) return variables[arg];
        if (defs.hasOwnProperty(arg)) return defs[arg];

        // string literal (starts/ends with quotes) -> use eval to parse escapes
        if ((arg.startsWith('"') && arg.endsWith('"')) ||
            (arg.startsWith("'") && arg.endsWith("'"))) {
            try { return eval(arg); } catch (e) { /* fallthrough */ }
        }

        // try to evaluate numeric / expression
        try {
            // allow expressions like 3+4, or `"a".toUpperCase()`, etc.
            return eval(arg);
        } catch (e) {
            // fallback : return raw token (e.g., bare word not defined)
            return arg;
        }
    }

    // ---------------------
    // Format pour affichage : objets => JSON, autres => String
    // ---------------------
    function toOutputText(v) {
        if (v === null) return "null";
        if (v === undefined) return "undefined";
        if (typeof v === "object") {
            try { return JSON.stringify(v); } catch { return String(v); }
        }
        return String(v);
    }

    // ---------------------
    // Commandes FrenchLang
    // ---------------------
    const commands = {
        "console.msg": argText => {
            const parts = splitArgs(argText).map(p => evalArg(p));
            const out = parts.map(toOutputText).join(" ");
            consoleFL.msg(out);
        },
        "console.att": argText => {
            const parts = splitArgs(argText).map(p => evalArg(p));
            const out = parts.map(toOutputText).join(" ");
            consoleFL.att(out);
        },
        "console.err": argText => {
            const parts = splitArgs(argText).map(p => evalArg(p));
            const out = parts.map(toOutputText).join(" ");
            consoleFL.err(out);
        },

        // var(name = value)
        "var": argText => {
            const idx = argText.indexOf("=");
            if (idx === -1) {
                consoleFL.err("Syntaxe var incorrecte : var(name = value)");
                return;
            }
            const name = argText.slice(0, idx).trim();
            const valueExpr = argText.slice(idx + 1).trim();
            if (!name) {
                consoleFL.err("Nom de variable vide");
                return;
            }
            variables[name] = evalArg(valueExpr);
        },

        // def(name = value) - immuable
        "def": argText => {
            const idx = argText.indexOf("=");
            if (idx === -1) {
                consoleFL.err("Syntaxe def incorrecte : def(name = value)");
                return;
            }
            const name = argText.slice(0, idx).trim();
            const valueExpr = argText.slice(idx + 1).trim();
            if (!name) {
                consoleFL.err("Nom de def vide");
                return;
            }
            if (defs.hasOwnProperty(name)) {
                consoleFL.err(`Erreur : def '${name}' est déjà défini !`);
                return;
            }
            defs[name] = evalArg(valueExpr);
        }
    };

    // ---------------------
    // Exécution ligne par ligne (gestion commentaires multi-lignes)
    // ---------------------
    const lignes = code.split(/\r?\n/);
    let inComment = false;

    lignes.forEach((ligne, index) => {
        ligne = (ligne || "").trim();

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
                try {
                    commands[cmd](arg);
                } catch (e) {
                    consoleFL.err(`Erreur ligne ${index + 1} (${cmd}): ${e}`);
                }
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
