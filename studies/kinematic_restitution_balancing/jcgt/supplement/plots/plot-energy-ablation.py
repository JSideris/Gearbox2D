#!/usr/bin/env python3
"""Build the Dataset A ablation figure from the supplement zip layout."""

from __future__ import annotations

import csv
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.ticker import MultipleLocator

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "dataset-a"
FIG = ROOT / "figures"

COLOR_ON = "#0072B2"
COLOR_OFF = "#D55E00"


def load_series(name: str) -> tuple[list[float], list[float], float | None]:
	t: list[float] = []
	r: list[float] = []
	escaped_at: float | None = None
	with (DATA / name).open() as f:
		for line in f:
			line = line.strip()
			if line.startswith("#"):
				if "escaped_at_step=" in line:
					for tok in line[1:].split():
						if tok.startswith("t_s="):
							escaped_at = float(tok.split("=", 1)[1])
				continue
			if line.startswith("t_s"):
				continue
			row = next(csv.reader([line]))
			t.append(float(row[0]))
			r.append(float(row[4]))
	return t, r, escaped_at


def window_means(t: list[float], r: list[float], width: float = 60.0) -> tuple[list[float], list[float]]:
	if not t:
		return [], []
	wt: list[float] = []
	wr: list[float] = []
	start = 0.0
	end = t[-1]
	while start <= end:
		vals = [ri for ti, ri in zip(t, r) if start <= ti < start + width]
		if vals:
			wt.append(start + width / 2.0)
			wr.append(sum(vals) / len(vals))
		start += width
	return wt, wr


def style_ax(ax, title: str, ylabel: bool = True) -> None:
	ax.axhline(1.0, color="0.55", ls="--", lw=0.6, zorder=0)
	ax.set_xlim(0, 600)
	ax.set_title(title, loc="left", fontsize=9, pad=4)
	ax.set_xlabel("Simulation time (s)", fontsize=8)
	if ylabel:
		ax.set_ylabel(r"$E / E_0$", fontsize=8)
	ax.tick_params(labelsize=7)
	ax.xaxis.set_major_locator(MultipleLocator(120))
	ax.grid(True, axis="y", lw=0.4, color="0.85")
	for spine in ("top", "right"):
		ax.spines[spine].set_visible(False)


def main() -> None:
	FIG.mkdir(parents=True, exist_ok=True)

	floor_on = load_series("floor-bounce-krb.csv")
	floor_off = load_series("floor-bounce-nokrb.csv")
	circle_on = load_series("bounce-circle-krb.csv")
	circle_off = load_series("bounce-circle-nokrb.csv")
	cradle_on = load_series("cradle-krb.csv")
	cradle_off = load_series("cradle-nokrb.csv")

	plt.rcParams.update({
		"font.family": "serif",
		"pdf.fonttype": 42,
		"ps.fonttype": 42,
		"axes.linewidth": 0.6,
	})

	fig, axes = plt.subplots(3, 1, figsize=(7.0, 7.2), sharex=False)
	fig.subplots_adjust(hspace=0.42, left=0.10, right=0.98, top=0.97, bottom=0.06)

	ax = axes[0]
	ax.plot(floor_on[0], floor_on[1], color=COLOR_ON, lw=1.2, label="KRB on")
	ax.plot(floor_off[0], floor_off[1], color=COLOR_OFF, lw=1.2, label="KRB off")
	style_ax(ax, "(a) Floor bounce")
	ax.set_ylim(0.0, 7.0)
	ax.legend(frameon=False, fontsize=8, loc="upper left")

	ax = axes[1]
	wt, wr = window_means(circle_on[0], circle_on[1])
	ax.plot(wt, wr, color=COLOR_ON, lw=1.2, label="KRB on (60 s mean)")
	ax.plot(circle_off[0], circle_off[1], color=COLOR_OFF, lw=1.2, marker="o", ms=3.5, label="KRB off")
	if circle_off[2] is not None:
		ax.plot(circle_off[2], circle_off[1][-1], marker="x", ms=8, mew=1.4, color=COLOR_OFF, zorder=3)
		ax.annotate(
			f"escaped\n$t={circle_off[2]:.1f}\\,\\mathrm{{s}}$",
			xy=(circle_off[2], circle_off[1][-1]),
			xytext=(90, 8.2),
			fontsize=7,
			color=COLOR_OFF,
			arrowprops={"arrowstyle": "->", "color": COLOR_OFF, "lw": 0.7},
		)
	style_ax(ax, "(b) High-pressure enclosure")
	ax.set_ylim(0.0, 11.0)
	ax.legend(frameon=False, fontsize=8, loc="upper right")

	ax = axes[2]
	ax.plot(cradle_on[0], cradle_on[1], color=COLOR_ON, lw=1.2, label="KRB on")
	ax.plot(cradle_off[0], cradle_off[1], color=COLOR_OFF, lw=1.2, label="KRB off")
	style_ax(ax, "(c) Newton's cradle")
	ax.set_ylim(0.8, 2.0)
	ax.legend(frameon=False, fontsize=8, loc="upper left")

	pdf = FIG / "fig-energy-ablation.pdf"
	png = FIG / "fig-energy-ablation.png"
	fig.savefig(pdf, dpi=300)
	fig.savefig(png, dpi=200)
	print(f"wrote {pdf}")
	print(f"wrote {png}")


if __name__ == "__main__":
	main()
