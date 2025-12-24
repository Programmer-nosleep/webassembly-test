#include <fmt/core.h>
#include <fmt/color.h>
#include <sqlite3.h>

#ifdef EMSCRIPTEN
#include <emscripten.h>
#endif

extern "C" {
	EMSCRIPTEN_KEEPALIVE
	int add (int a, int b) {
		fmt::print(fg(fmt::color::green), "Hello, World!\n");
		return a + b;
	}
}

EMSCRIPTEN_KEEPALIVE
int main(int argc, const char** argv) {
#if defined(EMSCRIPTEN)
	if (argc > 0) {
		fmt::print(fg(fmt::color::green), "Hello, World!\n");
	}
	return 0;
#endif
}
