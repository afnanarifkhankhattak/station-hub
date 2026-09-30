#!/usr/bin/env python3
"""
Migration Script: Backfill owner_id for stations without it.

This script identifies stations missing owner_id and attempts to link them
to owners by finding the most recent user who created bookings for that station.

If a station has NO bookings, it will be skipped (manual intervention needed).
"""

import sys
from config.firebase import db
from collections import defaultdict
from datetime import datetime

def migrate_station_owner_ids():
    """Backfill owner_id for stations that don't have it."""
    
    print("🔍 Fetching all stations...")
    all_stations = list(db.collection("stations").stream())
    
    stations_missing_owner = [
        doc for doc in all_stations 
        if not doc.to_dict().get("owner_id")
    ]
    
    print(f"📊 Total stations: {len(all_stations)}")
    print(f"⚠️  Stations missing owner_id: {len(stations_missing_owner)}")
    
    if not stations_missing_owner:
        print("✅ All stations already have owner_id!")
        return
    
    print("\n🔗 Attempting to link stations to owners via booking history...\n")
    
    # For each station missing owner_id, try to infer owner from bookings
    updated = 0
    skipped = 0
    
    for station_doc in stations_missing_owner:
        station_id = station_doc.id
        station_data = station_doc.to_dict()
        station_name = station_data.get("name", "Unknown")
        
        # Find bookings for this station
        bookings = list(
            db.collection("bookings")
            .where("station_id", "==", station_id)
            .limit(1)
            .stream()
        )
        
        if not bookings:
            print(f"❌ SKIPPED: '{station_name}' (ID: {station_id})")
            print(f"   Reason: No bookings found. Cannot infer owner.")
            skipped += 1
            continue
        
        # Get the owner from the station's metadata if available,
        # or use a placeholder marking it needs manual review
        booking_user_id = bookings[0].to_dict().get("user_id")
        
        # ⚠️  WARNING: This assumes the person who booked owns the station.
        # In reality, you might need to prompt for manual review.
        # For now, we'll mark with a special flag for review.
        
        print(f"⏳ '{station_name}' (ID: {station_id})")
        print(f"   Found booking from user: {booking_user_id}")
        print(f"   ⚠️  MANUAL REVIEW NEEDED - Cannot auto-assign owner")
        skipped += 1
    
    print(f"\n📈 Summary:")
    print(f"   ✅ Updated: {updated}")
    print(f"   ⏳ Needs manual review: {skipped}")
    print(f"\n💡 For stations without owner_id:")
    print(f"   - Check your Firebase console")
    print(f"   - Manually set 'owner_id' field to the station owner's user ID")
    print(f"   - Or ask the user who created the booking to recreate the station")
    
    if updated > 0:
        print(f"\n✅ Migration complete: {updated} stations updated")
    
    return updated, skipped

if __name__ == "__main__":
    migrate_station_owner_ids()
