// FrenchLang - Core logic (Node & Browser compatible)
// ===================================================

async function executeFrenchLang(code, consoleFL, parentScope = null) {
    if (!consoleFL) {
        consoleFL = {
            msg: console.log,
            att: console.warn,
            err: console.error
        };
    }

    const variables = {};
    const defs = {};
    const functions = {};
    const scope = parentScope || { variables, defs, functions };

    // Parse les arguments d'une commande
    function parseArg(ligne, cmd) {
        const regex = new RegExp(`${cmd}\\((.*)\\)`);
        const match = ligne.match(regex);
        return match ? match[1] : "";
    }

    // Split arguments en respectant les quotes et parenthèses
    function splitArgs(s) {
        const parts = [];
        let cur = "";
        let inSingle = false;
        let inDouble = false;
        let depth = 0;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            const prev = s[i - 1];
            if (ch === "'" && !inDouble && prev !== "\\") { inSingle = !inSingle; cur += ch; continue; }
            if (ch === '"' && !inSingle && prev !== "\\") { inDouble = !inDouble; cur += ch; continue; }
            if (!inSingle && !inDouble) {
                if (ch === "(") { depth++; cur += ch; continue; }
                if (ch === ")") { depth = Math.max(0, depth - 1); cur += ch; continue; }
                if (ch === "," && depth === 0) { parts.push(cur.trim()); cur = ""; continue; }
            }
            cur += ch;
        }
        if (cur.trim() !== "") parts.push(cur.trim());
        return parts;
    }

    // Eval une valeur simple ou variable
    function evalArg(arg, localVars = {}) {
        arg = (arg || "").trim();
        if (arg === "") return "";
        if (localVars.hasOwnProperty(arg)) return localVars[arg];
        if (scope.variables.hasOwnProperty(arg)) return scope.variables[arg];
        if (scope.defs.hasOwnProperty(arg)) return scope.defs[arg];
        if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
            try { return eval(arg); } catch {}
        }
        try { return eval(arg); } catch { return arg; }
    }

    // Convertit un objet en texte
    function toOutputText(v) {
        if (v === null) return "null";
        if (v === undefined) return "undefined";
        if (typeof v === "object") {
            try { return JSON.stringify(v); } catch { return String(v); }
        }
        return String(v);
    }

    // Affiche la sortie
    function joinAndLog(parts, fn) {
        const out = parts.map(toOutputText).join(" ");
        fn(out + "\n");
    }

   async function evalExpression(expr, localVars = {}) {
    expr = expr.trim();

    // Remplacer les variables locales et globales par leur valeur
    for (const v in localVars) {
        const re = new RegExp(`\\b${v}\\b`, "g");
        expr = expr.replace(re, JSON.stringify(localVars[v]));
    }
    for (const v in scope.variables) {
        const re = new RegExp(`\\b${v}\\b`, "g");
        expr = expr.replace(re, JSON.stringify(scope.variables[v]));
    }
    for (const v in scope.defs) {
        const re = new RegExp(`\\b${v}\\b`, "g");
        expr = expr.replace(re, JSON.stringify(scope.defs[v]));
    }

    // Appel de fonction
    const fnCall = expr.match(/^([a-zA-Z0-9_]+)\((.*)\)$/);
    if (fnCall) {
        const fname = fnCall[1];
        const args = splitArgs(fnCall[2] || "").map(a => evalExpression(a, localVars));
        if (!scope.functions[fname]) throw new Error(`Fonction '${fname}' non définie`);

        const funcLocalVars = {};
        scope.functions[fname].params.forEach((p, i) => funcLocalVars[p] = args[i]);

        for (let line of scope.functions[fname].body) {
            line = line.trim();
            if (line.startsWith("retourner(")) {
                const retVal = parseArg(line, "retourner");
                return await evalExpression(retVal, funcLocalVars);
            }
            for (const cmd in commands) {
                if (line.startsWith(cmd + "(")) {
                    const arg = parseArg(line, cmd);
                    await commands[cmd](arg, funcLocalVars);
                    break;
                }
            }
        }
        return undefined;
    }

    // Sinon évaluer l’expression JS complète
    try {
        return eval(expr);
    } catch {
        return expr;
    }
}


    // Commandes principales
    const commands = {
        "console.msg": (argText, localVars = {}) => {
            const parts = splitArgs(argText).map(p => evalExpression(p, localVars));
            joinAndLog(parts, consoleFL.msg);
        },
        "console.att": (argText, localVars = {}) => {
            const parts = splitArgs(argText).map(p => evalExpression(p, localVars));
            joinAndLog(parts, consoleFL.att);
        },
        "console.err": (argText, localVars = {}) => {
            const parts = splitArgs(argText).map(p => evalExpression(p, localVars));
            joinAndLog(parts, consoleFL.err);
        },
        "var": (argText, localVars = {}) => {
            const idx = argText.indexOf("=");
            if (idx === -1) throw new Error("Syntaxe var incorrecte");
            const name = argText.slice(0, idx).trim();
            const valueExpr = argText.slice(idx + 1).trim();
            if (!name) throw new Error("Nom de variable vide");
            scope.variables[name] = evalExpression(valueExpr, localVars);
        },
        "def": (argText, localVars = {}) => {
            const idx = argText.indexOf("=");
            if (idx === -1) throw new Error("Syntaxe def incorrecte");
            const name = argText.slice(0, idx).trim();
            const valueExpr = argText.slice(idx + 1).trim();
            if (!name) throw new Error("Nom de def vide");
            if (scope.defs.hasOwnProperty(name)) throw new Error(`def '${name}' déjà défini`);
            scope.defs[name] = evalExpression(valueExpr, localVars);
        }, 
        "attendre": async argText => {
            let t = argText.trim();
            let ms = 0;

            if (t.endsWith("ms")) {
                ms = parseFloat(t.slice(0, -2));
            } else if (t.endsWith("s")) {
                ms = parseFloat(t.slice(0, -1)) * 1000;
            } else {
                ms = parseFloat(t); // par défaut en ms
            }

            if (isNaN(ms)) throw new Error(`Temps invalide pour attendre: ${argText}`);

            await new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // Parse les lignes de code
    const lignes = code.split(/\r?\n/);
    let inComment = false;
    let inFunction = null;
    let buffer = [];

    try {
        for (let index = 0; index < lignes.length; index++) {
            let ligne = (lignes[index] || "").trim();
            if (ligne.startsWith("/*")) inComment = true;
            if (inComment) { if (ligne.endsWith("*/")) inComment = false; continue; }
            if (!ligne || ligne.startsWith("#")) continue;

            // Début fonction
            if (ligne.startsWith("fonction ")) {
                const fnMatch = ligne.match(/^fonction\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*{$/);
                if (!fnMatch) throw new Error(`Syntaxe fonction invalide à la ligne ${index+1}`);
                inFunction = fnMatch[1];
                const params = fnMatch[2].split(",").map(p => p.trim()).filter(p => p);
                buffer = [];
                scope.functions[inFunction] = { params, body: buffer };
                continue;
            }

            // Fin fonction
            if (inFunction && ligne === "}") { inFunction = null; buffer = []; continue; }
            if (inFunction) { buffer.push(ligne); continue; }

            // Commande var/def
            if (ligne.startsWith("var ") || ligne.startsWith("def ")) {
                const cmd = ligne.startsWith("var ") ? "var" : "def";
                const argText = ligne.slice(cmd.length).trim();
                commands[cmd](argText);
                continue;
            }

            // Appel fonction
            const callFn = ligne.match(/^([a-zA-Z0-9_]+)\((.*)\)$/);
            if (callFn) {
                const fname = callFn[1];
                const args = splitArgs(callFn[2] || "").map(p => evalExpression(p));
                if (!scope.functions[fname]) throw new Error(`Fonction '${fname}' non définie`);

                const localVars = {};
                scope.functions[fname].params.forEach((p, i) => localVars[p] = args[i]);

                try {
                    for (let line of scope.functions[fname].body) {
                        line = line.trim();
                        if (line.startsWith("retourner(")) {
                            const retVal = parseArg(line, "retourner");
                            throw { type: "return", value: evalExpression(retVal, localVars) };
                        }
                        for (const cmd in commands) {
                            if (line.startsWith(cmd + "(")) {
                                const arg = parseArg(line, cmd);
                                commands[cmd](arg, localVars);
                                break;
                            }
                        }
                    }
                } catch (e) {
                    if (e.type === "return") { variables[fname] = e.value; } 
                    else { throw e; }
                }
                continue;
            }

            // Commandes console globales
            let reconnue = false;
            for (const cmd in commands) {
                if (ligne.startsWith(cmd + "(")) {
                    const arg = parseArg(ligne, cmd);
                    await commands[cmd](arg);
                    reconnue = true;
                    break;
                }
            }

            if (!reconnue) throw new Error(`Ligne ${index+1} non reconnue : ${ligne}`);
        }
    } catch (e) {
        consoleFL.err("Erreur : " + e.message + "\n");
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = executeFrenchLang;
}
