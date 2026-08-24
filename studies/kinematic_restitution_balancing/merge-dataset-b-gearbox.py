#!/usr/bin/env python3
"""Replace Gearbox2D rows in Dataset B CSVs from an offline logEnergy --format b run."""

from __future__ import annotations

import argparse
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"

SCENES = (
	("dataset-b-floor-bounce-gearbox.csv", "dataset-b-floor-bounce-600s.csv"),
	("dataset-b-newtons-cradle-gearbox.csv", "dataset-b-newtons-cradle-600s.csv"),
)


def load_gearbox(path: Path) -> list[str]:
	rows: list[str] = []
	with path.open() as f:
		for line in f:
			line = line.rstrip("\n")
			if not line or line.startswith("#") or line.startswith("engine"):
				continue
			if not line.startswith("gearbox2d,"):
				raise SystemExit(f"{path}: expected gearbox2d row, got {line!r}")
			rows.append(line)
	if not rows:
		raise SystemExit(f"{path}: no gearbox2d rows")
	return rows


def merge(src_rows: list[str], dest: Path) -> None:
	header: list[str] = []
	other: list[str] = []
	with dest.open() as f:
		for line in f:
			line = line.rstrip("\n")
			if line.startswith("#") or line.startswith("engine"):
				header.append(line)
				continue
			if line.startswith("gearbox2d,"):
				continue
			if line:
				other.append(line)
	# Keep a recapture note after existing comments.
	notes = [h for h in header if h.startswith("#")]
	notes.append("# gearbox2d recaptured offline (logEnergy --format b); other engines unchanged")
	body = ["engine,t_s,e_over_e0", *src_rows, *other]
	dest.write_text("\n".join(notes + body) + "\n")
	print(f"merged {len(src_rows)} gearbox2d rows into {dest}")


def main() -> None:
	parser = argparse.ArgumentParser()
	parser.add_argument("--data", type=Path, default=DATA)
	args = parser.parse_args()
	for src_name, dest_name in SCENES:
		src = args.data / src_name
		dest = args.data / dest_name
		if not src.is_file():
			raise SystemExit(f"missing {src} (run ./logEnergy --format b --scene floor-bounce,cradle)")
		if not dest.is_file():
			raise SystemExit(f"missing {dest}")
		merge(load_gearbox(src), dest)


if __name__ == "__main__":
	main()
