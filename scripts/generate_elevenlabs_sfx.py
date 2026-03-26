import argparse
import json
import mimetypes
import os
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


API_URL = "https://api.elevenlabs.io/v1/sound-generation"
DEFAULT_MODEL = "eleven_text_to_sound_v2"


def infer_extension(content_type: str | None) -> str:
    if not content_type:
        return ".mp3"
    normalized = content_type.split(";")[0].strip().lower()
    if normalized in {"audio/mpeg", "audio/mp3"}:
        return ".mp3"
    if normalized in {"audio/wav", "audio/x-wav", "audio/wave"}:
        return ".wav"
    guessed = mimetypes.guess_extension(normalized)
    return guessed or ".bin"


def load_manifest(path: pathlib.Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def request_sound(api_key: str, item: dict, timeout: int) -> tuple[bytes, str | None, str | None]:
    payload = {
        "text": item["text"],
        "model_id": item.get("model_id", DEFAULT_MODEL),
    }
    if "duration_seconds" in item:
        payload["duration_seconds"] = item["duration_seconds"]
    if "loop" in item:
        payload["loop"] = item["loop"]
    if "prompt_influence" in item:
        payload["prompt_influence"] = item["prompt_influence"]

    output_format = item.get("output_format")
    url = API_URL
    if output_format:
        url = f"{API_URL}?{urllib.parse.urlencode({'output_format': output_format})}"

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "*/*",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
        return data, resp.headers.get("Content-Type"), resp.headers.get("character-cost")


def save_bytes(out_dir: pathlib.Path, filename: str, data: bytes, ext: str) -> pathlib.Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / f"{filename}{ext}"
    target.write_bytes(data)
    return target


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate SFX assets with ElevenLabs.")
    parser.add_argument("--manifest", default="scripts/elevenlabs_sfx_manifest.json")
    parser.add_argument("--output", default="src/assets/audio/generated/elevenlabs")
    parser.add_argument("--limit", type=int, default=0, help="Generate only the first N items.")
    parser.add_argument("--only", nargs="*", default=[], help="Generate only items with these ids.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files.")
    parser.add_argument("--timeout", type=int, default=180)
    parser.add_argument("--sleep", type=float, default=1.25, help="Delay between requests in seconds.")
    args = parser.parse_args()

    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        print("ELEVENLABS_API_KEY is not set.", file=sys.stderr)
        return 1

    manifest_path = pathlib.Path(args.manifest)
    out_dir = pathlib.Path(args.output)
    manifest = load_manifest(manifest_path)

    selected = manifest
    if args.only:
        wanted = set(args.only)
        selected = [item for item in manifest if item["id"] in wanted]
    if args.limit > 0:
        selected = selected[: args.limit]

    if not selected:
        print("No manifest items selected.")
        return 0

    total_cost = 0
    failures = 0

    for idx, item in enumerate(selected, start=1):
        existing = list(out_dir.glob(f"{item['filename']}.*"))
        if existing and not args.force:
            print(f"[skip {idx}/{len(selected)}] {item['id']} -> already exists")
            continue

        print(f"[gen  {idx}/{len(selected)}] {item['id']}")
        try:
            audio_bytes, content_type, character_cost = request_sound(api_key, item, args.timeout)
            ext = infer_extension(content_type)
            output = save_bytes(out_dir, item["filename"], audio_bytes, ext)
            cost = int(character_cost) if character_cost and character_cost.isdigit() else 0
            total_cost += cost
            print(f"        saved {output} ({len(audio_bytes)} bytes, cost={cost})")
        except urllib.error.HTTPError as exc:
            failures += 1
            body = exc.read().decode("utf-8", errors="replace")
            print(f"        ERROR {exc.code}: {body}", file=sys.stderr)
        except Exception as exc:
            failures += 1
            print(f"        ERROR: {exc}", file=sys.stderr)

        if idx < len(selected):
          time.sleep(args.sleep)

    print(f"Done. total_cost={total_cost} failures={failures}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
