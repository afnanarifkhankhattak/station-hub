"""
Usage (run from your backend folder, next to config/firebase.py):

  python seed_hev.py geocode   # fills missing lat/lon in the JSON (approximate), then REVIEW them
  python seed_hev.py seed      # writes stations that have coordinates to Firestore

Safe to re-run: each station has a fixed document id, so nothing is duplicated.
"""
import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent   # the Backend folder
sys.path.insert(0, str(BACKEND_DIR))                   # lets "config.firebase" be found

JSON_FILE = BACKEND_DIR / "Hev_stations_pakistan.json"


def load():
    with open(JSON_FILE, encoding="utf-8") as f:
        return json.load(f)


def save(rows):
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2, ensure_ascii=False)


def nominatim(query):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": query, "format": "json", "limit": 1, "countrycodes": "pk"}
    )
    req = urllib.request.Request(url, headers={"User-Agent": "station-hub-seed/1.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.load(r)
    return (float(data[0]["lat"]), float(data[0]["lon"])) if data else None


def geocode():
    rows = load()
    for r in rows:
        if r.get("latitude") is not None:
            continue
        # try the full address first, then fall back to the broader area
        area = r["address"].split(",")[-1].strip()
        for q, precision in (
            (f'{r["address"]}, {r["city"]}, Pakistan', "address"),
            (f'{area}, {r["city"]}, Pakistan', "area"),
        ):
            hit = nominatim(q)
            time.sleep(1.1)  # Nominatim allows 1 request/second
            if hit:
                r["latitude"], r["longitude"] = hit
                r["coord_precision"] = precision
                print(f'{r["id"]}: {hit} ({precision})')
                break
        else:
            print(f'{r["id"]}: NOT FOUND - fill lat/lon by hand')
    save(rows)
    print("\nOpen the JSON and check every 'coord_precision': 'area' entry on Google Maps.")


def seed():
    from config.firebase import db  # your existing Firebase setup

    rows = load()
    done = skipped = 0
    for r in rows:
        if r.get("latitude") is None or r.get("longitude") is None:
            print(f'SKIP (no coordinates): {r["id"]}')
            skipped += 1
            continue
        db.collection("stations").document(r["id"]).set(
            {
                "name": r["name"],
                "address": r["address"],
                "city": r["city"],
                "phone": r.get("phone", ""),
                "website": r.get("website", ""),
                "connectors": r.get("connectors", []),
                "latitude": float(r["latitude"]),
                "longitude": float(r["longitude"]),
                "opening": r["opening"],
                "closing": r["closing"],
                "sun_off": False,
                "station_type": "HEV",
                "status": "Active",
                "owner_id": "seed",
                "source": "seed",
                "avg_rating": 0,
                "rating_count": 0,
                "booking_count": 0,
                "created_at": datetime.utcnow().isoformat(),
            },
            merge=True,
        )
        done += 1
    print(f"Seeded {done}, skipped {skipped}")


if __name__ == "__main__":
    {"geocode": geocode, "seed": seed}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: print(__doc__))()