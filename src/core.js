// FrenchLang - Core logic (Node & Browser compatible)
// ===================================================

function executeFrenchLang(code, consoleFL) {
    if (!consoleFL) {
        consoleFL = {
            msg: console.log,
            att: console.warn,
            err: console.error
        };
    }

    const variables = {};
    const defs = {};
    const functions = {}; // <-- stockage des fonctions utilisateur

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
        fn(out + "\n");
    }

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

    const lignes = code.split(/\r?\n/);
    let inComment = false;
    let inFunction = null; // si on est dans une fonction en train d’être définie
    let buffer = [];

    try {
        for (let index = 0; index < lignes.length; index++) {
            let ligne = (lignes[index] || "").trim();

            if (ligne.startsWith("/*")) inComment = true;
            if (inComment) {
                if (ligne.endsWith("*/")) inComment = false;
                continue;
            }

            if (!ligne || ligne.startsWith("#")) continue;

            // Début fonction
            if (ligne.startsWith("fonction ")) {
                const name = ligne.match(/^fonction\s+([a-zA-Z0-9_]+)\s*\(\)\s*{$/);
                if (!name) throw new Error(`Syntaxe fonction invalide à la ligne ${index+1}`);
                inFunction = name[1];
                buffer = [];
                continue;
            }

            // Fin fonction
            if (inFunction && ligne === "}") {
                functions[inFunction] = buffer.slice();
                inFunction = null;
                buffer = [];
                continue;
            }

            // Si on est dans une fonction → on enregistre les lignes
            if (inFunction) {
                buffer.push(ligne);
                continue;
            }

            // Appel de fonction
            const callFn = ligne.match(/^([a-zA-Z0-9_]+)\(\)$/);
            if (callFn) {
                const fname = callFn[1];
                if (!functions[fname]) throw new Error(`Fonction '${fname}' non définie`);
                // exécuter son contenu récursivement
                executeFrenchLang(functions[fname].join("\n"), consoleFL);
                continue;
            }

            // Sinon → commandes classiques
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
        consoleFL.err("Erreur : " + e.message + "\n");
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = executeFrenchLang;
}
