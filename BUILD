load("//third_party/bazel_rules/rules_shell/shell:sh_binary.bzl", "sh_binary")

# Description:
#   Deployment package for Cloud Run IAP POC.

sh_binary(
    name = "deploy",
    srcs = ["deploy.sh"],
    data = glob([
        "terraform/**",
    ]) + [
        "//experimental/emea-oce-tooling/arch-modernization-studio/app:app_files",
    ],
)
