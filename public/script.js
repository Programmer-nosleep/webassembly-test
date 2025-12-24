(() => {
  const btn = document.getElementById("wasm");
  const outEl = document.getElementById("out");
  const aEl = document.getElementById("a");
  const bEl = document.getElementById("b");

  const waitForWasmReady = () =>
    new Promise((resolve) => {
      if (typeof Module !== "undefined" && Module.calledRun) return resolve();
      window.addEventListener("wasm:ready", () => resolve(), { once: true });
    });

  btn.addEventListener("click", async () => {
    try {
      if (typeof Module === "undefined") throw new Error("Module is not defined yet");
      if (typeof Module.ccall !== "function") throw new Error("Module.ccall is not available");
      await waitForWasmReady();
      const a = Number(aEl?.value ?? 0);
      const b = Number(bEl?.value ?? 0);
      const result = Module.ccall("add", "number", ["number", "number"], [a, b]);
      outEl.textContent = String(result);
    } catch (e) {
      console.error(e);
      outEl.textContent = `Error: ${e?.message ?? e}`;
    }
  });
})();
