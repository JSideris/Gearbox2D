#!/usr/bin/env python3
"""Build the Dataset B four-engine figure from the supplement zip layout."""

from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.ticker import MultipleLocator

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "dataset-b"
FIG = ROOT / "figures"

COLORS = {
	"gearbox2d": "#0072B2",
	"box2dwasm": "#D55E00",
	"p2js": "#009E73",
	"matterjs": "#CC79A7",
}
LABELS = {
	"gearbox2d": "Gearbox2D (KRB on)",
	"box2dwasm": "Box2D-WASM",
	"p2js": "p2.js",
	"matterjs": "Matter.js",
}
ORDER = ("gearbox2d", "box2dwasm", "p2js", "matterjs")


def load_engines(name: str) -> dict[str, tuple[list[float], list[float]]]:
	series: dict[str, tuple[list[float], list[float]]] = defaultdict(lambda: ([], []))
	with (DATA / name).open() as f:
		for line in f:
			line = line.strip()
			if not line or line.startswith("#") or line.startswith("engine"):
				continue
			row = next(csv.reader([line]))
			eng, t, r = row[0], float(row[1]), float(row[2])
			series[eng][0].append(t)
			series[eng][1].append(r)
	return {eng: (series[eng][0], series[eng][1]) for eng in ORDER if eng in series}


def style_ax(ax, title: str) -> None:
	ax.axhline(1.0, color="0.55", ls="--", lw=0.6, zorder=0)
	ax.set_xlim(0, 600)
	ax.set_title(title, loc="left", fontsize=9, pad=4)
	ax.set_xlabel("Simulation time (s)", fontsize=8)
	ax.set_ylabel(r"$E / E_0$", fontsize=8)
	ax.tick_params(labelsize=7)
	ax.xaxis.set_major_locator(MultipleLocator(120))
	ax.grid(True, axis="y", lw=0.4, color="0.85")
	for spine in ("top", "right"):
		ax.spines[spine].set_visible(False)


def plot_engines(ax, series: dict[str, tuple[list[float], list[float]]]) -> None:
	for eng in ORDER:
		t, r = series[eng]
		ax.plot(t, r, color=COLORS[eng], lw=1.2, label=LABELS[eng])


def main() -> None:
	FIG.mkdir(parents=True, exist_ok=True)

	floor = load_engines("dataset-b-floor-bounce-600s.csv")
	cradle = load_engines("dataset-b-newtons-cradle-600s.csv")

	plt.rcParams.update({
		"font.family": "serif",
		"pdf.fonttype": 42,
		"ps.fonttype": 42,
		"axes.linewidth": 0.6,
	})

	fig, axes = plt.subplots(2, 1, figsize=(7.0, 5.4), sharex=False)
	fig.subplots_adjust(hspace=0.40, left=0.10, right=0.98, top=0.96, bottom=0.09)

	ax = axes[0]
	plot_engines(ax, floor)
	style_ax(ax, "(a) Floor bounce")
	ax.set_ylim(-0.15, 7.0)
	ax.legend(frameon=False, fontsize=8, loc="upper left")

	ax = axes[1]
	plot_engines(ax, cradle)
	style_ax(ax, "(b) Newton's cradle")
	ax.set_ylim(-0.05, 1.25)
	ax.legend(frameon=False, fontsize=8, loc="upper right")

	pdf = FIG / "fig-energy-engines.pdf"
	png = FIG / "fig-energy-engines.png"
	fig.savefig(pdf, dpi=300)
	fig.savefig(png, dpi=200)
	print(f"wrote {pdf}")
	print(f"wrote {png}")


if __name__ == "__main__":
	main()
