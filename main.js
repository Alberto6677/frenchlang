const editor = document.getElementById("editor");
const logs = document.getElementById("logs");
const runBtn = document.getElementById("runBtn");

const consoleFL = {
    msg: txt => appendLog(txt, "msg"),
    att: txt => appendLog(txt, "warn"),
    err: txt => appendLog(txt, "error")
};

function appendLog(txt, type) {
    const span = document.createElement("span");
    span.textContent = txt + "\n";
    if(type==="warn") span.style.color = "orange";
    if(type==="error") span.style.color = "red";
    logs.appendChild(span);
    logs.scrollTop = logs.scrollHeight;
}

// Charger hello.fl depuis Render
async function loadExample(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.statusText);
        const text = await res.text();
        editor.value = text;
    } catch (err) {
        consoleFL.err("Impossible de charger le fichier FL : " + err);
    }
}

// Bouton Lancer
runBtn.addEventListener("click", () => {
    logs.innerHTML = "";
    if (typeof executeFrenchLang === "function") {
        executeFrenchLang(editor.value, consoleFL);
    } else {
        consoleFL.err("L'interpréteur n'est pas chargé !");
    }
});

// Chargement initial
loadExample("examples/hello.fl");
