from pathlib import Path

import numpy as np
from PIL import Image

src = Path(
    r"C:\Users\lunex\.cursor\projects\c-Users-lunex-Desktop-mono-repo-projeto-clinica-front-projeto-clinica\assets\c__Users_lunex_AppData_Roaming_Cursor_User_workspaceStorage_073084895a18752ef89cd1379fe88c31_images_ChatGPT_Image_21_08_2026__14_25_51-a23cbaa7-82cc-4596-9934-6bf201b70306.png"
)
dst = Path(__file__).resolve().parents[1] / "public" / "checkout" / "left-card-bg.png"

im = Image.open(src).convert("RGB")
arr = np.array(im)
r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
page_white = (r >= 250) & (g >= 250) & (b >= 250)
content = ~page_white
ys = np.where(np.any(content, axis=1))[0]
xs = np.where(np.any(content, axis=0))[0]
y0, y1 = int(ys[0]), int(ys[-1]) + 1
x0, x1 = int(xs[0]), int(xs[-1]) + 1
crop = arr[y0:y1, x0:x1].copy()

h, w = crop.shape[:2]
sample = crop[h // 8 : h // 4, w // 4 : w * 3 // 4]
mint = np.median(sample.reshape(-1, 3), axis=0).astype(np.uint8)

cr, cg, cb = crop[:, :, 0], crop[:, :, 1], crop[:, :, 2]
near_white = (cr >= 246) & (cg >= 246) & (cb >= 246)
crop[near_white] = mint

pad_top = int(h * 0.12)
pad_side = max(2, int(w * 0.01))
out = np.full((h + pad_top, w + pad_side * 2, 3), mint, dtype=np.uint8)
out[pad_top:, pad_side : pad_side + w] = crop

dst.parent.mkdir(parents=True, exist_ok=True)
Image.fromarray(out).save(dst, "PNG", optimize=True)
print("saved", dst, out.shape[1], out.shape[0], "mint", mint.tolist())
