#include <cstdlib>
#include <string>

#if __has_include(<fmt/core.h>)
#include <fmt/color.h>
#include <fmt/core.h>

#define HAS_FMT 1
#else
#define HAS_FMT 0
#endif

#if defined(__EMSCRIPTEN__)
#include <emscripten/emscripten.h>
#define WASM_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define WASM_EXPORT
#endif

extern "C" {
	WASM_EXPORT
	const char* adding_some_values(const char* val) {
		static std::string storage;
		storage = (val ? val : "");
		return storage.c_str();
	}

	WASM_EXPORT
	void free_string(void* p) {
		(void)p;
	}
}
