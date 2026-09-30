from config.firebase import db

def backfill_booking_counts():
    bookings = db.collection("bookings").stream()
    counts = {}

    for doc in bookings:
        data = doc.to_dict()
        station_id = data.get("station_id")
        if not station_id:
            continue
        if data.get("status") in ("cancelled", "rejected"):
            continue
        counts[station_id] = counts.get(station_id, 0) + 1

    for station_id, count in counts.items():
        db.collection("stations").document(station_id).update({
            "booking_count": count
        })
        print(f"Updated {station_id}: {count} bookings")

    all_stations = db.collection("stations").stream()
    for s in all_stations:
        if s.id not in counts:
            db.collection("stations").document(s.id).update({"booking_count": 0})
            print(f"Updated {s.id}: 0 bookings")

if __name__ == "__main__":
    backfill_booking_counts()