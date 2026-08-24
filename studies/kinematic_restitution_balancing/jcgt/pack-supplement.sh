#!/usr/bin/env bash
# Pack jcgt/supplement/ into jcgt/krb-supplement.zip (paths relative to zip root).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
STUDY="$(cd "$HERE/.." && pwd)"
SRC="$HERE/supplement"
ZIP="$HERE/krb-supplement.zip"

copy() {
	mkdir -p "$(dirname "$2")"
	cp -a "$1" "$2"
}

mkdir -p \
	"$SRC/data/dataset-a" \
	"$SRC/data/dataset-b" \
	"$SRC/data/dataset-c" \
	"$SRC/data/timing" \
	"$SRC/plots" \
	"$SRC/figures"

copy "$STUDY/data/floor-bounce-krb.csv" "$SRC/data/dataset-a/floor-bounce-krb.csv"
copy "$STUDY/data/floor-bounce-nokrb.csv" "$SRC/data/dataset-a/floor-bounce-nokrb.csv"
copy "$STUDY/data/bounce-circle-krb.csv" "$SRC/data/dataset-a/bounce-circle-krb.csv"
copy "$STUDY/data/bounce-circle-nokrb.csv" "$SRC/data/dataset-a/bounce-circle-nokrb.csv"
copy "$STUDY/data/cradle-krb.csv" "$SRC/data/dataset-a/cradle-krb.csv"
copy "$STUDY/data/cradle-nokrb.csv" "$SRC/data/dataset-a/cradle-nokrb.csv"

copy "$STUDY/data/dataset-b-floor-bounce-600s.csv" "$SRC/data/dataset-b/dataset-b-floor-bounce-600s.csv"
copy "$STUDY/data/dataset-b-newtons-cradle-600s.csv" "$SRC/data/dataset-b/dataset-b-newtons-cradle-600s.csv"

copy "$STUDY/data/dataset-c/cradle-krb.csv" "$SRC/data/dataset-c/cradle-krb.csv"
copy "$STUDY/data/dataset-c/bounce-circle-krb.csv" "$SRC/data/dataset-c/bounce-circle-krb.csv"

copy "$STUDY/data/timing/timing-summary-krb.csv" "$SRC/data/timing/timing-summary-krb.csv"
copy "$STUDY/data/timing/timing-summary-nokrb.csv" "$SRC/data/timing/timing-summary-nokrb.csv"

copy "$STUDY/figures/fig-energy-ablation.pdf" "$SRC/figures/fig-energy-ablation.pdf"
copy "$STUDY/figures/fig-energy-engines.pdf" "$SRC/figures/fig-energy-engines.pdf"
copy "$STUDY/figures/fig-energy-dataset-c.pdf" "$SRC/figures/fig-energy-dataset-c.pdf"

rm -f "$ZIP"
(
	cd "$SRC"
	zip -q -r "$ZIP" \
		README.md \
		LICENSE \
		listings \
		data \
		plots \
		figures
)

echo "wrote $ZIP"
