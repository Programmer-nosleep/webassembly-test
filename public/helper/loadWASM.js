export async function loadWasm(url, imports = {}) {
  let wasmExportsPromise;
  if (wasmExportsPromise) return wasmExportsPromise;

  wasmExportsPromise = (async () => {
    if (WebAssembly.instantiateStreaming) {
      try {
        const { instance } = await WebAssembly.instantiateStreaming(fetch(url), imports);
        return instance.exports;
      } catch (e) {
        console.warn("instantiateStreaming failed, fallback to ArrayBuffer:", e);
      }
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch failed: HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(buf, imports);
    return instance.exports;
  })();

  return wasmExportsPromise;
}

