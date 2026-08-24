#!/usr/bin/env python3
"""Build the Dataset C long-horizon figure from the supplement zip layout."""

from __future__ import annotations

import csv
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.ticker import MultipleLocator

ROOT = Path(__file__).resolve().parent.parent
DATA_C = ROOT / "data" / "dataset-c"
FIG = ROOT / "figures"

COLOR_ON = "#0072B2"


def load_series(path: Path) -> tuple[list[float], list[float]]:
	t: list[float] = []
	r: list[float] = []
	with path.open() as f:
		for line in f:
			line = line.strip()
			if not line or line.startswith("#") or line.startswith("t_s"):
				continue
			row = next(csv.reader([line]))
			t.append(float(row[0]))
			r.append(float(row[4]))
	return t, r


def window_means(
	t: list[float], r: list[float], width: float
) -> tuple[list[float], list[float]]:
	if not t:
		return [], []
	wt: list[float] = []
	wr: list[float] = []
	start = 0.0
	end = t[-1]
	while start + width <= end + 1e-9:
		vals = [ri for ti, ri in zip(t, r) if start <= ti < start + width]
		if vals:
			wt.append(start + width / 2.0)
			wr.append(sum(vals) / len(vals))
		start += width
	return wt, wr


def style_ax(ax, title: str, xmax: float, ylabel: bool = True) -> None:
	ax.axhline(1.0, color="0.55", ls="--", lw=0.6, zorder=0)
	ax.set_xlim(0, xmax)
	ax.set_title(title, loc="left", fontsize=9, pad=4)
	ax.set_xlabel("Simulation time (s)", fontsize=8)
	if ylabel:
		ax.set_ylabel(r"$E / E_0$", fontsize=8)
	ax.tick_params(labelsize=7)
	ax.xaxis.set_major_locator(MultipleLocator(7200))
	ax.grid(True, axis="y", lw=0.4, color="0.85")
	for spine in ("top", "right"):
		ax.spines[spine].set_visible(False)


def main() -> None:
	FIG.mkdir(parents=True, exist_ok=True)

	cradle = load_series(DATA_C / "cradle-krb.csv")
	enclosure = load_series(DATA_C / "bounce-circle-krb.csv")

	cradle_wt, cradle_wr = window_means(cradle[0], cradle[1], 60.0)
	encl_wt, encl_wr = window_means(enclosure[0], enclosure[1], 600.0)

	plt.rcParams.update({
		"font.family": "serif",
		"pdf.fonttype": 42,
		"ps.fonttype": 42,
		"axes.linewidth": 0.6,
	})

	fig, axes = plt.subplots(2, 1, figsize=(7.0, 5.0), sharex=True)
	fig.subplots_adjust(hspace=0.35, left=0.10, right=0.98, top=0.97, bottom=0.08)

	ax = axes[0]
	ax.plot(cradle_wt, cradle_wr, color=COLOR_ON, lw=1.2, label="60 s mean")
	style_ax(ax, "(a) Newton's cradle (KRB on, 8 h)", 28800.0)
	ax.set_ylim(0.93, 1.10)
	ax.legend(frameon=False, fontsize=8, loc="upper right")

	ax = axes[1]
	ax.plot(encl_wt, encl_wr, color=COLOR_ON, lw=1.2, label="600 s mean")
	style_ax(ax, "(b) High-pressure enclosure (KRB on, 8 h)", 28800.0, ylabel=True)
	ax.set_ylim(0.96, 1.02)
	ax.legend(frameon=False, fontsize=8, loc="upper right")

	pdf = FIG / "fig-energy-dataset-c.pdf"
	png = FIG / "fig-energy-dataset-c.png"
	fig.savefig(pdf, dpi=300)
	fig.savefig(png, dpi=200)
	print(f"wrote {pdf}")
	print(f"wrote {png}")


if __name__ == "__main__":
	main()
