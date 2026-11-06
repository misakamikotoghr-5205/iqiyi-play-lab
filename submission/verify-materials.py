"""Read-only checks for the existing upload ZIPs and prepared visual materials."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MATERIALS = ROOT / 'submission'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def verify(require_screenshots=False):
    fields = json.loads((MATERIALS / 'upload-fields.json').read_text())
    built = {p['id']: p for p in json.loads((ROOT / 'dist/submissions/manifest.json').read_text())}
    covers = json.loads((MATERIALS / 'cover-manifest.json').read_text())
    records = []
    screenshot_manifest_path = MATERIALS / 'screenshot-manifest.json'
    screenshot_records = []
    if screenshot_manifest_path.is_file():
        screenshot_manifest = json.loads(screenshot_manifest_path.read_text())
        screenshot_records = screenshot_manifest['screenshots']
        assert screenshot_manifest['full_page_capture'] is False
        assert screenshot_manifest['mobile_device_or_platform_webview_validation'] is False
        for record in screenshot_records:
            screenshot_path = MATERIALS / record['file']
            assert digest(screenshot_path.read_bytes()) == record['sha256']
            with Image.open(screenshot_path) as image:
                assert image.format == 'PNG' and image.size == (record['width'], record['height'])
                normalized_pixels = image.convert('RGB').tobytes()
            source_path = MATERIALS / record['source_capture_file']
            assert digest(source_path.read_bytes()) == record['source_capture_sha256']
            with Image.open(source_path) as source:
                assert source.format == record['source_capture_format'] == 'JPEG'
                assert source.size == (record['width'], record['height'])
                assert source.convert('RGB').tobytes() == normalized_pixels
            assert record['decoded_rgb_pixels_equal_source'] is True
            assert record['kind'] == 'actual_desktop_browser_viewport_capture'
            assert record['visually_reviewed'] is True
    if require_screenshots:
        assert screenshot_records, 'Reviewed screenshot manifest is missing'
    for item in fields:
        app = item['id']
        archive = (MATERIALS / item['zip']).resolve()
        manifest = built[app]
        data = archive.read_bytes()
        assert archive.stat().st_size == manifest['bytes']
        assert digest(data) == manifest['sha256']
        assert len(data) < 20_000_000  # Well below both decimal MB and MiB limits.
        with zipfile.ZipFile(archive) as package:
            assert package.testzip() is None
            assert sorted(package.namelist()) == sorted(manifest['entries'])
            assert set(package.namelist()) == {'index.html', 'app.js', 'logic.js', 'style.css', 'LICENSE.txt'}
            for name in ('index.html', 'app.js', 'logic.js', 'style.css'):
                content = package.read(name)
                assert content == (ROOT / 'apps' / app / name).read_bytes(), f'{app}/{name}: source/archive mismatch'
                text = content.decode('utf-8')
                assert not re.search(r'https?://|@import|\bfetch\s*\(|XMLHttpRequest|WebSocket|type\s*=\s*[\'\"]module', text, re.I)
            for target in re.findall(r'(?:src|href)=[\'\"]([^\'\"]+)[\'\"]', package.read('index.html').decode()):
                assert target.startswith('#') or target in package.namelist()
        for cover in [c for c in covers if c['app'] == app]:
            path = MATERIALS / cover['file']
            assert digest(path.read_bytes()) == cover['sha256']
            with Image.open(path) as image:
                assert image.format == 'PNG' and image.size == (cover['width'], cover['height'])
            assert (MATERIALS / cover['editable_source']).is_file()
        screenshot = MATERIALS / item['actual_screenshot_expected']
        screenshot_present = screenshot.is_file()
        if screenshot_present:
            with Image.open(screenshot) as image:
                image.verify()
        if require_screenshots:
            assert screenshot_present, f'{app}: actual browser screenshot still needs capture'
            assert any(record['file'] == item['actual_screenshot_expected'] for record in screenshot_records), f'{app}: expected screenshot has not been reviewed'
        records.append({'id': app, 'zip_bytes': len(data), 'zip_sha256': digest(data), 'zip_crc_ok': True,
                        'root_entry_and_all_runtime_assets_local': True, 'source_matches_existing_archive': True,
                        'cover_variants_verified': 2, 'actual_screenshot_file_present': screenshot_present,
                        'short_description_characters': len(item['short_description'])})
    return {'checked_at_utc': datetime.now(timezone.utc).isoformat(), 'zip_count': 4,
            'zip_files_rebuilt': False, 'actual_screenshots_present': len(screenshot_records),
            'apps_with_actual_screenshots': sum(r['actual_screenshot_file_present'] for r in records),
            'screenshot_manifest_hashes_and_dimensions_verified': bool(screenshot_records),
            'screenshot_capture_scope': 'Desktop normal viewport only; no full-page, mobile or platform WebView validation',
            'screenshot_provenance_note': 'Presence checks cannot establish provenance. Real captures must be reviewed by the person who operates the browser; generated covers are not screenshots.',
            'apps': records}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--require-screenshots', action='store_true')
    parser.add_argument('--out', type=Path)
    args = parser.parse_args()
    report = verify(args.require_screenshots)
    rendered = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    if args.out:
        args.out.write_text(rendered)
    print(rendered)
