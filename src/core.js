// FrenchLang - Core logic (Node & Browser compatible)
// =========================================================

async function executeFrenchLang(code, consoleFL, parentScope = null) {
    if (!consoleFL) consoleFL = { msg: console.log, att: console.warn, err: console.error };
    const variables = {};
    const defs = {};
    const functions = {};
    const scope = parentScope || { variables, defs, functions };

    function parseArg(ligne, cmd) {
        const regex = new RegExp(`${cmd}\\((.*)\\)`);
        const match = ligne.match(regex);
        return match ? match[1] : "";
    }

    function splitArgs(s) {
        const parts = [];
        let cur = "", inSingle = false, inDouble = false, depth = 0;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i], prev = s[i-1];
            if (ch === "'" && !inDouble && prev !== "\\") { inSingle = !inSingle; cur+=ch; continue; }
            if (ch === '"' && !inSingle && prev !== "\\") { inDouble = !inDouble; cur+=ch; continue; }
            if (!inSingle && !inDouble) {
                if (ch === "(") { depth++; cur+=ch; continue; }
                if (ch === ")") { depth=Math.max(0,depth-1); cur+=ch; continue; }
                if (ch === "," && depth===0) { parts.push(cur.trim()); cur=""; continue; }
            }
            cur+=ch;
        }
        if (cur.trim()!=="") parts.push(cur.trim());
        return parts;
    }

    async function evalExpression(expr, localVars={}) {
        expr = expr.trim();
        for (const v in localVars) expr = expr.replace(new RegExp(`\\b${v}\\b`, "g"), JSON.stringify(localVars[v]));
        for (const v in scope.variables) expr = expr.replace(new RegExp(`\\b${v}\\b`, "g"), JSON.stringify(scope.variables[v]));
        for (const v in scope.defs) expr = expr.replace(new RegExp(`\\b${v}\\b`, "g"), JSON.stringify(scope.defs[v]));

        const fnCall = expr.match(/^([a-zA-Z0-9_]+)\((.*)\)$/);
        if (fnCall && scope.functions[fnCall[1]]) {
            const fname = fnCall[1];
            const args = await Promise.all(splitArgs(fnCall[2]||"").map(a=>evalExpression(a, localVars)));
            const funcLocalVars = {};
            scope.functions[fname].params.forEach((p,i)=>funcLocalVars[p]=args[i]);
            for (let line of scope.functions[fname].body) {
                line=line.trim();
                if (line.startsWith("retourner(")) return await evalExpression(parseArg(line,"retourner"), funcLocalVars);
                for (const cmd in commands) if (line.startsWith(cmd+"(")) { await commands[cmd](parseArg(line,cmd), funcLocalVars); break; }
            }
            return undefined;
        }

        try { return await eval(expr); } catch { return expr; }
    }

    function toOutputText(v) {
        if (v===null) return "null";
        if (v===undefined) return "undefined";
        if (typeof v==="object") { try { return JSON.stringify(v); } catch { return String(v); } }
        return String(v);
    }

    function joinAndLog(parts, fn) { fn(parts.map(toOutputText).join(" ")+"\n"); }

    const colors = ["red","orange","yellow","green","cyan","blue","magenta"];
    const commands = {
        "console.msg": async (argText, localVars={}) => joinAndLog(await Promise.all(splitArgs(argText).map(p=>evalExpression(p, localVars))), consoleFL.msg),
        "console.att": async (argText, localVars={}) => joinAndLog(await Promise.all(splitArgs(argText).map(p=>evalExpression(p, localVars))), consoleFL.att),
        "console.err": async (argText, localVars={}) => joinAndLog(await Promise.all(splitArgs(argText).map(p=>evalExpression(p, localVars))), consoleFL.err),
        "console.a67": async (argText, localVars={}) => {
            const msg = String(await evalExpression(argText, localVars));
            let fmt = "", styles = [];
            for (let i=0;i<msg.length;i++) { fmt+="%c"+msg[i]; styles.push(`color:${colors[i%colors.length]}`); }
            consoleFL.msg(fmt, ...styles);
        },
        "var": async (argText, localVars={}) => { const idx=argText.indexOf("="); if(idx==-1) throw new Error("Syntaxe var incorrecte"); const name=argText.slice(0,idx).trim(); const val=argText.slice(idx+1).trim(); scope.variables[name]=await evalExpression(val, localVars); },
        "def": async (argText, localVars={}) => { const idx=argText.indexOf("="); if(idx==-1) throw new Error("Syntaxe def incorrecte"); const name=argText.slice(0,idx).trim(); if(scope.defs[name]) throw new Error(`def '${name}' déjà défini`); const val=argText.slice(idx+1).trim(); scope.defs[name]=await evalExpression(val, localVars); },
        "attendre": async argText => {
            let t = argText.trim(), ms=0;
            if(t.endsWith("ms")) ms=parseFloat(t.slice(0,-2));
            else if(t.endsWith("s")) ms=parseFloat(t.slice(0,-1))*1000;
            else ms=parseFloat(t);
            if(isNaN(ms)) throw new Error(`Temps invalide pour attendre: ${argText}`);
            await new Promise(r=>setTimeout(r,ms));
        }
    };

    const lignes = code.split(/\r?\n/);
    let inComment=false, inFunction=null, buffer=[];

    try{
        for(let index=0;index<lignes.length;index++){
            let ligne=(lignes[index]||"").trim();
            if(ligne.startsWith("/*")) inComment=true;
            if(inComment){ if(ligne.endsWith("*/")) inComment=false; continue; }
            if(!ligne||ligne.startsWith("#")) continue;

            if(ligne.startsWith("fonction ")){
                const fnMatch = ligne.match(/^fonction\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*{$/);
                if(!fnMatch) throw new Error(`Syntaxe fonction invalide à la ligne ${index+1}`);
                inFunction=fnMatch[1];
                const params = fnMatch[2].split(",").map(p=>p.trim()).filter(p=>p);
                buffer=[];
                scope.functions[inFunction]={params,body:buffer};
                continue;
            }

            if(inFunction && ligne==="}") { inFunction=null; buffer=[]; continue; }
            if(inFunction) { buffer.push(ligne); continue; }

            // Commandes globales ou fonctions
            let reconnue=false;
            for(const cmd in commands){
                if(ligne.startsWith(cmd+"(")){
                    await commands[cmd](parseArg(ligne,cmd));
                    reconnue=true;
                    break;
                }
            }
            if(!reconnue){
                const callFn = ligne.match(/^([a-zA-Z0-9_]+)\((.*)\)$/);
                if(callFn && scope.functions[callFn[1]]) {
                    await evalExpression(ligne);
                    reconnue=true;
                }
            }
            if(!reconnue) throw new Error(`Ligne ${index+1} non reconnue : ${ligne}`);
        }
    } catch(e){ consoleFL.err("Erreur : "+e.message+"\n"); }
}

if(typeof module!=="undefined"&&module.exports) module.exports=executeFrenchLang;
