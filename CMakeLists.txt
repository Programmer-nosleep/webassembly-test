cmake_minimum_required (VERSION 3.20)

# Enable Hot Reload for MSVC compilers if supported.
if (POLICY CMP0141)
  cmake_policy(SET CMP0141 NEW)
  set(CMAKE_MSVC_DEBUG_INFORMATION_FORMAT "$<IF:$<AND:$<C_COMPILER_ID:MSVC>,$<CXX_COMPILER_ID:MSVC>>,$<$<CONFIG:Debug,RelWithDebInfo>:EditAndContinue>,$<$<CONFIG:Debug,RelWithDebInfo>:ProgramDatabase>>")
endif()

project ("wasm-cpp" LANGUAGES C CXX)

include(Depedencies.cmake)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/build-web)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/build-web)


file(GLOB SOURCE_FILES
  "src/main.cpp"
  "src/stream.cpp"
  "src/add.cpp"
)

# Include sub-projects.
add_subdirectory(src)
add_executable(${PROJECT_NAME} ${SOURCE_FILES})

# Emscripten specific settings
if(EMSCRIPTEN)
 	target_link_options(${PROJECT_NAME} PRIVATE
    "-sSTANDALONE_WASM=1"
    "-sALLOW_MEMORY_GROWTH=1"
    "-sFORCE_FILESYSTEM=0"
    "-Wl,--no-entry"
    "-sEXPORTED_FUNCTIONS=['_add', '_just_string_you_can_output_from_the_console_browser', '_malloc', '_free']"
    "-sEXPORTED_RUNTIME_METHODS=['ccall','cwrap']"
    # "-sINITIAL_MEMORY=8388608"
    # "-sMAXIMUM_MEMORY=67108864"
    # "-sSTACK_SIZE=1048576"
    "-sASSERTIONS=1"
  )
  set_target_properties(${PROJECT_NAME} PROPERTIES
    OUTPUT_NAME "worker"
    SUFFIX ".wasm"
  )
endif()

if(NOT EMSCRIPTEN)
  target_link_libraries(${PROJECT_NAME} PRIVATE sqlite3::sqlite3)
  target_link_libraries(${PROJECT_NAME} PRIVATE fmt::fmt)
endif()
