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
)

# Include sub-projects.
add_subdirectory(src)
add_executable(${PROJECT_NAME} ${SOURCE_FILES})

# Emscripten specific settings
if(EMSCRIPTEN)
	target_link_options(${PROJECT_NAME} PRIVATE
    "-sNO_EXIT_RUNTIME=0"
    "-sEXIT_RUNTIME=1"
    "-sFORCE_FILESYSTEM=0"
    "-sEXPORTED_FUNCTIONS=['_add','_main','_adding_some_values','_free_string']"
    "-sEXPORTED_RUNTIME_METHODS=['ccall','cwrap']"
    "-sALLOW_MEMORY_GROWTH=1"
    # "-sINITIAL_MEMORY=8388608"
    # "-sMAXIMUM_MEMORY=67108864"
    # "-sSTACK_SIZE=1048576"
    "-sASSERTIONS=1"
  )
  set_target_properties(${PROJECT_NAME} PROPERTIES
    OUTPUT_NAME "worker"
  )
endif()

target_link_libraries(${PROJECT_NAME} PRIVATE sqlite3::sqlite3)
target_link_libraries(${PROJECT_NAME} PRIVATE fmt::fmt)
