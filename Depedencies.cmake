include(cmake/CPM.cmake)

CPMAddPackage(
    NAME          sqlite-amalgamation
    URL           https://www.sqlite.org/2024/sqlite-amalgamation-3450300.zip
    DOWNLOAD_ONLY YES
    EXCLUDE_FROM_ALL
)

if(sqlite-amalgamation_ADDED AND NOT TARGET sqlite3::sqlite3)
    add_library(sqlite3 STATIC "${sqlite-amalgamation_SOURCE_DIR}/sqlite3.c")
    target_include_directories(sqlite3 PUBLIC "${sqlite-amalgamation_SOURCE_DIR}")
    target_compile_definitions(sqlite3 PUBLIC SQLITE_THREADSAFE=0)
    add_library(sqlite3::sqlite3 ALIAS sqlite3)
endif()

CPMAddPackage(
    NAME fmt
    GITHUB_REPOSITORY fmtlib/fmt
    GIT_TAG 10.2.1
    OPTIONS
      "FMT_TEST OFF"
      "FMT_DOC OFF"
)
