const consoleFL = {
    msg: txt => appendLog(txt, "msg"),
    att: txt => appendLog(txt, "warn"),
    err: txt => appendLog(txt, "error")
};

function appendLog(txt, type) {
    const span = document.createElement("span");
    span.textContent = txt + "\n";
    if(type === "warn") span.style.color = "orange";
    if(type === "error") span.style.color = "red";
    document.getElementById("logs").appendChild(span);
}

// Pour exécuter le code depuis un textarea ou fetch
function runFL() {
    const code = document.getElementById("editor").value;
    executeFrenchLang(code, consoleFL);
}
