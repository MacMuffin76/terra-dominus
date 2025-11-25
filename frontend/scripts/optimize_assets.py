import argparse
import logging
import struct
import zlib
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
STRATEGIES = [
  zlib.Z_DEFAULT_STRATEGY,
  zlib.Z_FILTERED,
  zlib.Z_RLE,
]


def read_chunks(data):
  offset = 8
  chunks = []
  while offset < len(data):
    length = int.from_bytes(data[offset : offset + 4], "big")
    offset += 4
    ctype = data[offset : offset + 4]
    offset += 4
    cdata = data[offset : offset + length]
    offset += length
    crc = data[offset : offset + 4]
    offset += 4
    chunks.append((ctype, cdata, crc))
    if ctype == b"IEND":
      break
  return chunks


def rebuild_png(chunks):
  output = bytearray(PNG_SIGNATURE)
  for ctype, cdata in chunks:
    output.extend(len(cdata).to_bytes(4, "big"))
    output.extend(ctype)
    output.extend(cdata)
    output.extend(struct.pack(">I", zlib.crc32(ctype + cdata) & 0xFFFFFFFF))
  return bytes(output)


def recompress_png(path: Path):
  data = path.read_bytes()
  if not data.startswith(PNG_SIGNATURE):
    return False, 0

  chunks = read_chunks(data)
  idat_indices = [i for i, (ctype, _, _) in enumerate(chunks) if ctype == b"IDAT"]
  if not idat_indices:
    return False, 0

  idat_data = b"".join(chunks[i][1] for i in idat_indices)

  try:
    decompressed = zlib.decompress(idat_data)
  except zlib.error:
    return False, 0

  best = idat_data
  for strategy in STRATEGIES:
    compressor = zlib.compressobj(level=9, wbits=15, strategy=strategy)
    candidate = compressor.compress(decompressed) + compressor.flush()
    if len(candidate) < len(best):
      best = candidate

  if len(best) >= len(idat_data):
    return False, 0

  first, last = idat_indices[0], idat_indices[-1]
  new_chunks = [chunk[:2] for chunk in chunks[:first]]
  new_chunks.append((b"IDAT", best))
  new_chunks.extend(chunk[:2] for chunk in chunks[last + 1 :])

  optimized_bytes = rebuild_png(new_chunks)
  path.write_bytes(optimized_bytes)
  saved = len(data) - len(optimized_bytes)
  return True, saved


def find_heavy_assets(root: Path, threshold: int):
  return sorted(
    [p for p in root.rglob("*.png") if p.is_file() and p.stat().st_size >= threshold],
    key=lambda f: f.stat().st_size,
    reverse=True,
  )


def main():
  parser = argparse.ArgumentParser(description="Optimise les assets PNG via recompression.")
  parser.add_argument("--root", default="frontend/public/images", help="Dossier racine à analyser")
  parser.add_argument("--threshold", type=int, default=1_000_000, help="Taille minimale en octets")
  parser.add_argument("--limit", type=int, default=0, help="Nombre max de fichiers à traiter (0 = tous)")
  parser.add_argument("--apply", action="store_true", help="Écrit les fichiers optimisés")
  args = parser.parse_args()

  root = Path(args.root).resolve()
  if not root.exists():
    raise SystemExit(f"Dossier introuvable: {root}")

  heavy_assets = find_heavy_assets(root, args.threshold)
  logging.info("%s fichiers au-dessus de %s octets détectés", len(heavy_assets), args.threshold)

  processed = 0
  for asset in heavy_assets:
    if args.limit and processed >= args.limit:
      break
    original_size = asset.stat().st_size
    if args.apply:
      success, saved = recompress_png(asset)
      if success:
        logging.info(
          "Optimisé %s (%.2f MB -> %.2f MB, -%.2f KB)",
          asset,
          original_size / 1e6,
          asset.stat().st_size / 1e6,
          saved / 1024,
        )
      else:
        logging.info("Aucune optimisation pour %s (%.2f MB)", asset, original_size / 1e6)
    else:
      logging.info("%s (%.2f MB)", asset, original_size / 1e6)
    processed += 1

  if args.apply:
    logging.info("Optimisation terminée pour %s fichier(s)", processed)
  else:
    logging.info("Exécution en mode audit uniquement")


if __name__ == "__main__":
  main()