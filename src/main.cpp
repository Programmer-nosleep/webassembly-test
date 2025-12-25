#include <string>

#if __has_include(<fmt/core.h>)
#include <fmt/core.h>
#include <fmt/color.h>
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
	int add (int a, int b) {
#if HAS_FMT
		fmt::print(fg(fmt::color::green), "Hello, World!\n");
#endif
		return a + b;
	}
}

extern "C" const char* adding_some_values(const char* val);
extern "C" void free_string(void* p);

WASM_EXPORT
int main(int argc, const char** argv) {
#if defined(__EMSCRIPTEN__)
	if (argc > 0) {
#if HAS_FMT
		fmt::print(fg(fmt::color::green), "Hello, World!\n");
#endif
	}
	return 0;
#endif
}
