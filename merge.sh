#!/usr/bin/env bash
set -e

usage() {
  echo "Usage: svgs-to-pdf -o output files_to_merge..."
  echo ""
  echo "   -o, --output       Path of output file, e.g. merged.pdf"
  echo "   -h, --help         This help text"
  echo ""
}

cwd=$(pwd)

files=()
while [ $# -gt 0 ]; do
  case $1 in
  -h | --help)
    usage
    exit 0
    ;;
  -o | --output)
    merged_output="$2"
    shift
    ;;
  -*)
    usage >&2
    exit 1
    ;;
  *)
    files+=("$1")
    ;;
  esac
  shift
done

if [ -z "$merged_output" ]; then
  echo "missing --output" >&2
  usage >&2
  exit 1
fi

if [ -z "${files[*]}" ]; then
  echo "missing files to merge" >&2
  usage >&2
  exit 1
fi

tmpdir=$(mktemp -d -t svgs-to-pdf.XXXXXXXXXX)
shopt -s globstar
for file in "${files[@]}"; do
  pdf_path="$tmpdir/${file%.*}.pdf"
  mkdir -p "$(dirname "$pdf_path")"
  rsvg-convert -f pdf -o "$pdf_path" "$file"
done

cd "$tmpdir"
pdftools merge -o "${cwd}/${merged_output}" ./**/*.pdf
