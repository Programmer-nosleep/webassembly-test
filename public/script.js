import { loadWasm } from "./helper/loadWASM.js";

/**
 * Ringkasnya:
 * - Kita load `worker.wasm` langsung via WebAssembly API (tanpa JS "glue" dari Emscripten).
 * - Karena WASM kamu minta import `wasi_snapshot_preview1`, berarti dia bergaya WASI/standalone.
 *   Jadi browser wajib dikasih `imports.wasi_snapshot_preview1` (fd_write, fd_seek, dll).
 *
 * Kenapa ada urusan pointer + memory?
 * - WASM itu punya "linear memory" (ArrayBuffer). Semua string C (`char*`) itu isinya ada di sana.
 * - Kalau mau kirim string dari JS ke WASM, kita harus:
 *   1) Encode UTF-8 + tambah `\0`
 *   2) `malloc` di heap WASM
 *   3) Copy bytes ke `wasm.memory.buffer`
 *   4) Panggil function WASM pakai pointer-nya
 *   5) `free` kalau sudah tidak dipakai
 */

(() => {
  const btn = document.getElementById("wasm");
  const outEl = document.getElementById("out");
  const aEl = document.getElementById("a");
  const bEl = document.getElementById("b");
  const valEl = document.getElementById("val");

  btn.addEventListener("click", async () => {
    try {
      const valId = valEl?.id ?? "val";
      const valInput = valEl?.value ?? "";

      // Cache-busting biar WASM yang ke-load selalu versi terbaru (nggak ke-cache).
      const url = "build-web/worker.wasm?v=" + Date.now();

      // `memory` akan diisi setelah WASM berhasil di-instantiate.
      // Kita simpan ke variable luar supaya `fd_write` (WASI) bisa baca isi memory.
      let memory;

      // `imports` harus sesuai dengan daftar import yang diminta WASM.
      // Kalau `imports` kurang/beda, error-nya biasanya seperti:
      // "Import #1 'wasi_snapshot_preview1': module is not an object or function"
      const imports = {
        env: {
          // Dipanggil Emscripten kalau memory grow; di sini no-op.
          emscripten_notify_memory_growth: () => {},
        },
        wasi_snapshot_preview1: {
          // Implementasi minimal WASI biar instantiate sukses.
          // Return code WASI: 0 = success, 8 = EBADF (bad file descriptor)
          fd_close: (fd) => (fd === 0 || fd === 1 || fd === 2 ? 0 : 8),
          // 29 = ESPIPE (illegal seek). Kita bilang "seek tidak didukung".
          fd_seek: (_fd, _offsetLow, _offsetHigh, _whence, _newoffsetPtr) => 29,
          // `fd_write` dipakai program buat nulis ke stdout/stderr.
          // WASI ngirim array iovec: tiap entry berisi { ptr, len } (8 byte: 4+4).
          fd_write: (fd, iovs, iovsLen, nwritten) => {
            if (!memory) return 8;
            if (fd !== 1 && fd !== 2) return 8;

            const view = new DataView(memory.buffer);
            let written = 0;
            const chunks = [];

            for (let i = 0; i < iovsLen; i++) {
              const ptr = view.getUint32(iovs + i * 8, true);
              const len = view.getUint32(iovs + i * 8 + 4, true);
              chunks.push(new Uint8Array(memory.buffer, ptr, len));
              written += len;
            }

            view.setUint32(nwritten, written, true);

            const bytes = new Uint8Array(written);
            let off = 0;
            for (const c of chunks) {
              bytes.set(c, off);
              off += c.length;
            }

            const text = new TextDecoder("utf-8").decode(bytes);
            if (fd === 2) console.error(text);
            else console.log(text);

            return 0;
          },
        },
      };

      const wasm = await loadWasm(url, imports);
      // Karena WASM ini export `memory`, setelah instantiate kita bisa ambil di sini.
      memory = wasm.memory;

      // const a = Number(aEl?.value ?? 0);
      // const b = Number(bEl?.value ?? 0);

      // const addFn = wasm._add || wasm.add;
      // if (typeof addFn !== "function") throw new Error("WASM export `add` not found");

      // const result = addFn(a | 0, b | 0);
      // outEl.textContent = String(result);

      // Ambil function export dari WASM.
      // Kadang namanya ada prefix `_` tergantung konfigurasi build.
      const value =
        wasm._just_string_you_can_output_from_the_console_browser ||
        wasm.just_string_you_can_output_from_the_console_browser;
      if (typeof value !== "function")
        throw new Error("WASM export `just_string_you_can_output_from_the_console_browser` not found");

      // Untuk kirim string ke WASM, kita butuh allocator di heap WASM.
      const malloc = wasm._malloc || wasm.malloc;
      const free = wasm._free || wasm.free;
      if (typeof malloc !== "function" || typeof free !== "function")
        throw new Error("WASM exports `malloc/free` not found");
      if (!memory) throw new Error("WASM export `memory` not found");

      // Helper untuk convert JS string <-> C string (UTF-8).
      const encoder = new TextEncoder();
      const decoder = new TextDecoder("utf-8");

      // Tulis string JS ke WASM memory sebagai C string: UTF-8 + '\0'.
      const writeCString = (str) => {
        const bytes = encoder.encode(str + "\0");
        const ptr = malloc(bytes.length);
        new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
        return ptr;
      };

      // Baca C string dari WASM memory (stop saat ketemu '\0').
      const readCString = (ptr) => {
        const mem = new Uint8Array(memory.buffer);
        let end = ptr;
        while (end < mem.length && mem[end] !== 0) end++;
        return decoder.decode(mem.subarray(ptr, end));
      };

      // Alur panggil function:
      // 1) allocate + tulis input string
      // 2) panggil function WASM (return pointer output)
      // 3) free input pointer
      const inPtr = writeCString(valInput);
      const outPtr = value(inPtr);
      free(inPtr);

      // `outPtr` dianggap pointer ke heap-allocated string (di C++ kamu memang malloc).
      // Jadi setelah dibaca, kita free juga.
      const outStr = outPtr ? readCString(outPtr) : "";
      if (outPtr) free(outPtr);

      // outEl.textContent = outStr ? `${outStr} | ${valId}=${valInput}` : `${valId}=${valInput}`;
      if (valInput.trim() === "") {
        outEl.textContent = "Enter your input first, please!";
        return;
      }
      outEl.textContent = outStr;
    } catch (e) {
      console.error(e);
      outEl.textContent = `Error: ${e?.message ?? e}`;
    }
  });
})();
