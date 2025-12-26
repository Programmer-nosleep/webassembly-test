#include <cstdlib>
#include <string>
#include <cstring>

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
		std::free(p);
	}

	// Return a heap-allocated UTF-8 string that JS can read via UTF8ToString(ptr),
	// then free via free_string(ptr).
	WASM_EXPORT
	const char* just_string_you_can_output_from_the_console_browser(const char* val) {
		std::string s = (val ? val : "");
		char* out = static_cast<char*>(std::malloc(s.size() + 1));
		if (!out) return nullptr;
		std::memcpy(out, s.c_str(), s.size() + 1);
		return out;
	}
}

WASM_EXPORT
std::string just_string_you_can_output_from_the_console_browser(const std::string& val) {
	return val;
}
