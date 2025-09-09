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
    // Utils
    // ---------------------
    function parseArg(ligne, cmd) {
        const regex = new RegExp(`${cmd}\\((.*)\\)`);
        const match = ligne.match(regex);
        return match ? match[1] : "";
    }

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
                inSingle = !inSingle; cur += ch; continue;
            }
            if (ch === '"' && !inSingle && prev !== "\\") {
                inDouble = !inDouble; cur += ch; continue;
            }

            if (!inSingle && !inDouble) {
                if (ch === "(") { depth++; cur += ch; continue; }
                if (ch === ")") { depth = Math.max(0, depth - 1); cur += ch; continue; }
                if (ch === "," && depth === 0) {
                    parts.push(cur.trim()); cur = ""; continue;
                }
            }

            cur += ch;
        }
        if (cur.trim() !== "") parts.push(cur.trim());
        return parts;
    }

    function evalArg(arg) {
        arg = (arg || "").trim();
        if (arg === "") return "";

        if (variables.hasOwnProperty(arg)) return variables[arg];
        if (defs.hasOwnProperty(arg)) return defs[arg];

        if ((arg.startsWith('"') && arg.endsWith('"')) ||
            (arg.startsWith("'") && arg.endsWith("'"))) {
            try { return eval(arg); } catch {}
        }

        try {
            return eval(arg);
        } catch {
            return arg;
        }
    }

    function toOutputText(v) {
        if (v === null) return "null";
        if (v === undefined) return "undefined";
        if (typeof v === "object") {
            try { return JSON.stringify(v); } catch { return String(v); }
        }
        return String(v);
    }

    function joinAndLog(parts, fn) {
        const out = parts.map(toOutputText).join(" ");
        fn(out + "\n"); // << ajout retour ligne systématique
    }

    // ---------------------
    // Commandes
    // ---------------------
    const commands = {
        "console.msg": argText => {
            const parts = splitArgs(argText).map(p => evalArg(p));
            joinAndLog(parts, consoleFL.msg);
        },
        "console.att": argText => {
            const parts = splitArgs(argText).map(p => evalArg(p));
            joinAndLog(parts, consoleFL.att);
        },
        "console.err": argText => {
            const parts = splitArgs(argText).map(p => evalArg(p));
            joinAndLog(parts, consoleFL.err);
        },
        "var": argText => {
            const idx = argText.indexOf("=");
            if (idx === -1) throw new Error("Syntaxe var incorrecte");
            const name = argText.slice(0, idx).trim();
            const valueExpr = argText.slice(idx + 1).trim();
            if (!name) throw new Error("Nom de variable vide");
            variables[name] = evalArg(valueExpr);
        },
        "def": argText => {
            const idx = argText.indexOf("=");
            if (idx === -1) throw new Error("Syntaxe def incorrecte");
            const name = argText.slice(0, idx).trim();
            const valueExpr = argText.slice(idx + 1).trim();
            if (!name) throw new Error("Nom de def vide");
            if (defs.hasOwnProperty(name)) {
                throw new Error(`def '${name}' déjà défini`);
            }
            defs[name] = evalArg(valueExpr);
        }
    };

    // ---------------------
    // Exécution
    // ---------------------
    const lignes = code.split(/\r?\n/);
    let inComment = false;

    try {
        for (let index = 0; index < lignes.length; index++) {
            let ligne = (lignes[index] || "").trim();

            if (ligne.startsWith("/*")) inComment = true;
            if (inComment) {
                if (ligne.endsWith("*/")) inComment = false;
                continue;
            }

            if (!ligne || ligne.startsWith("#")) continue;

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
                throw new Error(`Ligne ${index + 1} non reconnue : ${ligne}`);
            }
        }
    } catch (e) {
        // une seule erreur imprévue, on arrête tout
        consoleFL.err("Erreur : " + e.message + "\n");
    }
}

// Pour Node.js
if (typeof module !== "undefined" && module.exports) {
    module.exports = executeFrenchLang;
}
