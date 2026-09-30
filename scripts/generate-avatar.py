"""Trace the supplied transparent Poincaré-disc artwork into SVG paths.

Requires Pillow, NumPy and contourpy in the local authoring environment.
The published SVG contains geometry only; it does not embed the source PNG.
"""

from pathlib import Path

import contourpy
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/assets/tanh_avatar.png"
TARGET = ROOT / "public/assets/tanh-avatar.svg"


def simplify(points: list[tuple[float, float]], tolerance: float = 0.18) -> list[tuple[float, float]]:
    """Drop subpixel deviations while preserving each traced edge."""
    if len(points) < 4:
        return points
    keep = [points[0]]
    for index in range(1, len(points) - 1):
        ax, ay = keep[-1]
        bx, by = points[index]
        cx, cy = points[index + 1]
        length = ((cx - ax) ** 2 + (cy - ay) ** 2) ** 0.5
        distance = abs((cx - ax) * (ay - by) - (ax - bx) * (cy - ay)) / max(length, 1e-9)
        if distance > tolerance:
            keep.append((bx, by))
    keep.append(points[-1])
    return keep


def main() -> None:
    alpha = np.asarray(Image.open(SOURCE).getchannel("A"), dtype=np.float32)
    contours = contourpy.contour_generator(z=alpha, fill_type="OuterCode")
    polygons, codes = contours.filled(127.5, 256)
    commands: list[str] = []

    for polygon, path_codes in zip(polygons, codes):
        ring: list[tuple[float, float]] = []
        for point, code in zip(polygon, path_codes):
            if code == 1 and ring:
                add_ring(commands, ring)
                ring = []
            if code == 79:
                add_ring(commands, ring)
                ring = []
                continue
            ring.append((float(point[0]), float(point[1])))
        if ring:
            add_ring(commands, ring)

    path = " ".join(commands)
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" '
        'role="img" aria-labelledby="avatar-title avatar-desc">'
        '<title id="avatar-title">Tanh avatar</title>'
        '<desc id="avatar-desc">Poincaré disc pattern traced from the original artwork.</desc>'
        f'<path fill="currentColor" fill-rule="evenodd" d="{path}"/>'
        '</svg>\n'
    )
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(svg, encoding="utf-8")
    print(f"Generated {TARGET.relative_to(ROOT)} with {len(commands)} contour rings.")


def add_ring(commands: list[str], ring: list[tuple[float, float]]) -> None:
    if len(ring) < 3:
        return
    points = simplify(ring)
    if len(points) < 3:
        return
    commands.append(
        "M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in points) + " Z"
    )


if __name__ == "__main__":
    main()
