load("//devtools/python/blaze:pytype.bzl", "pytype_strict_binary")
load("//third_party/bazel_rules/rules_python/python:py_test.bzl", "py_test")

pytype_strict_binary(
    name = "app",
    srcs = ["app.py"],
    data = glob(["static/**"]),
    deps = [
        "//third_party/py/flask",
    ],
)

py_test(
    name = "engine_test",
    srcs = ["engine_test.py"],
    data = ["app.py"],
    deps = [
        "//third_party/py/flask",
    ],
)

filegroup(
    name = "app_files",
    srcs = [
        "Dockerfile",
        "app.py",
        "requirements.txt",
    ] + glob(["static/**"]),
    visibility = ["//experimental/emea-oce-tooling/arch-modernization-studio:__subpackages__"],
)
