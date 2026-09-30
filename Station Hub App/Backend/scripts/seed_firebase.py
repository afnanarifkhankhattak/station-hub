"""
Station Hub — Firebase Dummy Data Seeder
=========================================
HOW TO RUN:
  1. Place this file inside your Backend/ folder
  2. Make sure your Firebase credentials are set up (config/firebase.py must work)
  3. Run:  python seed_firebase.py
  4. Check your Firestore console — all collections will be populated
"""

import sys
import os

# So imports like 'from config.firebase import db' resolve correctly
sys.path.insert(0, os.path.dirname(__file__))

from config.firebase import db
from datetime import datetime, timedelta
import random

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def ts(days_ago=0, hours_ago=0):
    """Return ISO timestamp string offset from now."""
    dt = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)
    return dt.isoformat()

def date_str(days_from_now=0):
    dt = datetime.utcnow() + timedelta(days=days_from_now)
    return dt.strftime("%Y-%m-%d")

# ─────────────────────────────────────────────
# 1. USERS
# ─────────────────────────────────────────────
# NOTE: Passwords here are bcrypt hashes of "password123"
# In production these are created via /auth/register — we seed
# them directly only for dashboard user-count stats.

USERS = [
    {
        "id": "user_001",
        "full_name": "Ahmed Raza",
        "email": "ahmed.raza@example.com",
        "password": "$2b$12$KIXsamplehashforseeding001",
        "phone": "+92-300-1234567",
        "profile_image": "",
        "created_at": ts(30),
    },
    {
        "id": "user_002",
        "full_name": "Sara Khan",
        "email": "sara.khan@example.com",
        "password": "$2b$12$KIXsamplehashforseeding002",
        "phone": "+92-321-9876543",
        "profile_image": "",
        "created_at": ts(25),
    },
    {
        "id": "user_003",
        "full_name": "Bilal Malik",
        "email": "bilal.malik@example.com",
        "password": "$2b$12$KIXsamplehashforseeding003",
        "phone": "+92-333-4455667",
        "profile_image": "",
        "created_at": ts(20),
    },
    {
        "id": "user_004",
        "full_name": "Fatima Noor",
        "email": "fatima.noor@example.com",
        "password": "$2b$12$KIXsamplehashforseeding004",
        "phone": "+92-345-7788990",
        "profile_image": "",
        "created_at": ts(15),
    },
    {
        "id": "user_005",
        "full_name": "Usman Tariq",
        "email": "usman.tariq@example.com",
        "password": "$2b$12$KIXsamplehashforseeding005",
        "phone": "+92-311-2233445",
        "profile_image": "",
        "created_at": ts(10),
    },
]

# ─────────────────────────────────────────────
# 2. STATIONS
# ─────────────────────────────────────────────

STATIONS = [
    {
        "id": "station_001",
        "name": "Rawalpindi General Bus Terminal",
        "city": "Rawalpindi",
        "address": "Committee Chowk, Rawalpindi, Punjab",
        "latitude": 33.5651,
        "longitude": 73.0169,
        "image": "",
        "amenities": ["WiFi", "Waiting Lounge", "Cafeteria", "Parking", "Prayer Room"],
        "created_at": ts(60),
    },
    {
        "id": "station_002",
        "name": "Lahore Daewoo Terminal",
        "city": "Lahore",
        "address": "Thokar Niaz Baig, Lahore, Punjab",
        "latitude": 31.4504,
        "longitude": 74.2707,
        "image": "",
        "amenities": ["WiFi", "AC Lounge", "Cafeteria", "Parking", "ATM"],
        "created_at": ts(55),
    },
    {
        "id": "station_003",
        "name": "Islamabad Faizabad Interchange",
        "city": "Islamabad",
        "address": "Faizabad, Islamabad Capital Territory",
        "latitude": 33.7083,
        "longitude": 73.0551,
        "image": "",
        "amenities": ["WiFi", "Waiting Area", "Snack Bar"],
        "created_at": ts(50),
    },
    {
        "id": "station_004",
        "name": "Karachi Sohrab Goth Terminal",
        "city": "Karachi",
        "address": "Sohrab Goth, Karachi, Sindh",
        "latitude": 24.9398,
        "longitude": 67.0728,
        "image": "",
        "amenities": ["Waiting Lounge", "Cafeteria", "Parking"],
        "created_at": ts(45),
    },
    {
        "id": "station_005",
        "name": "Peshawar Storyteller Chowk Terminal",
        "city": "Peshawar",
        "address": "Storyteller Road, Peshawar, KPK",
        "latitude": 34.0151,
        "longitude": 71.5249,
        "image": "",
        "amenities": ["WiFi", "Waiting Room", "Mosque"],
        "created_at": ts(40),
    },
]

# ─────────────────────────────────────────────
# 3. SERVICES  (owner_id = your logged-in user's Firebase UID)
# ─────────────────────────────────────────────
# IMPORTANT: Replace "YOUR_FIREBASE_UID" with your actual UID
# You can find it in Firebase Console → Authentication → Users
OWNER_ID = "YOUR_FIREBASE_UID"

SERVICES = [
    {
        "id": "service_001",
        "owner_id": OWNER_ID,
        "name": "Economy Class Bus",
        "categories": {
            "sedan": {"price": 1200.0},
            "hatchback": {"price": 1000.0},
            "suv": {"price": 1500.0},
            "economy_bike": {"price": 500.0},
            "standard_bike": {"price": 700.0},
            "premium_bike": {"price": 1200.0},
        },
        "description": "Comfortable economy seats with AC and basic amenities.",
        "status": "Active",
        "rating": 4.2,
        "image_url": "",
        "created_at": ts(30),
    },
    {
        "id": "service_002",
        "owner_id": OWNER_ID,
        "name": "Business Class Coach",
        "categories": {
            "sedan": {"price": 2500.0},
            "hatchback": {"price": 2200.0},
            "suv": {"price": 3000.0},
            "full_suv": {"price": 3500.0},
            "economy_bike": {"price": 900.0},
            "standard_bike": {"price": 1200.0},
            "premium_bike": {"price": 1800.0},
        },
        "description": "Wide reclining seats, snacks included, USB charging ports.",
        "status": "Active",
        "rating": 4.7,
        "image_url": "",
        "created_at": ts(28),
    },
    {
        "id": "service_003",
        "owner_id": OWNER_ID,
        "name": "Sleeper Coach",
        "categories": {
            "sedan": {"price": 3500.0},
            "suv": {"price": 4000.0},
            "full_suv": {"price": 4500.0},
        },
        "description": "Full flat beds, overnight travel, meals provided.",
        "status": "Active",
        "rating": 4.9,
        "image_url": "",
        "created_at": ts(25),
    },
    {
        "id": "service_004",
        "owner_id": OWNER_ID,
        "name": "Mini Van Shuttle",
        "categories": {
            "sedan": {"price": 800.0},
            "hatchback": {"price": 700.0},
        },
        "description": "Quick point-to-point shuttle for short routes.",
        "status": "Active",
        "rating": 3.9,
        "image_url": "",
        "created_at": ts(20),
    },
    {
        "id": "service_005",
        "owner_id": OWNER_ID,
        "name": "Premium SUV Hire",
        "categories": {
            "suv": {"price": 6000.0},
            "full_suv": {"price": 8000.0},
            "pickup": {"price": 7000.0},
        },
        "description": "Private SUV with driver for full-day or intercity trips.",
        "status": "Inactive",
        "rating": 4.5,
        "image_url": "",
        "created_at": ts(15),
    },
]

# ─────────────────────────────────────────────
# 4. BOOKINGS
# ─────────────────────────────────────────────

STATUSES = ["pending", "confirmed", "completed", "cancelled"]

BOOKINGS = [
    {
        "id": "booking_001",
        "user_id": "user_001",
        "user_name": "Ahmed Raza",
        "station_id": "station_001",
        "service_id": "service_001",
        "from_location": "Rawalpindi",
        "to_location": "Lahore",
        "travel_date": date_str(1),
        "travel_time": "08:00 AM",
        "seat_count": 2,
        "price": 2400.0,
        "car": "Economy Bus — RWP-LAH-01",
        "status": "pending",
        "created_at": ts(1),
    },
    {
        "id": "booking_002",
        "user_id": "user_002",
        "user_name": "Sara Khan",
        "station_id": "station_002",
        "service_id": "service_002",
        "from_location": "Lahore",
        "to_location": "Islamabad",
        "travel_date": date_str(2),
        "travel_time": "10:30 AM",
        "seat_count": 1,
        "price": 2500.0,
        "car": "Business Coach — LHR-ISB-07",
        "status": "confirmed",
        "created_at": ts(2),
    },
    {
        "id": "booking_003",
        "user_id": "user_003",
        "user_name": "Bilal Malik",
        "station_id": "station_003",
        "service_id": "service_003",
        "from_location": "Islamabad",
        "to_location": "Karachi",
        "travel_date": date_str(0),   # today
        "travel_time": "09:00 PM",
        "seat_count": 2,
        "price": 7000.0,
        "car": "Sleeper Coach — ISB-KHI-03",
        "status": "completed",
        "created_at": ts(3),
    },
    {
        "id": "booking_004",
        "user_id": "user_004",
        "user_name": "Fatima Noor",
        "station_id": "station_004",
        "service_id": "service_004",
        "from_location": "Karachi",
        "to_location": "Hyderabad",
        "travel_date": date_str(3),
        "travel_time": "07:00 AM",
        "seat_count": 3,
        "price": 2400.0,
        "car": "Mini Van — KHI-HYD-02",
        "status": "pending",
        "created_at": ts(0, 6),
    },
    {
        "id": "booking_005",
        "user_id": "user_005",
        "user_name": "Usman Tariq",
        "station_id": "station_005",
        "service_id": "service_005",
        "from_location": "Peshawar",
        "to_location": "Islamabad",
        "travel_date": date_str(1),
        "travel_time": "11:00 AM",
        "seat_count": 1,
        "price": 8000.0,
        "car": "Premium SUV — PEW-ISB-01",
        "status": "confirmed",
        "created_at": ts(0, 3),
    },
    {
        "id": "booking_006",
        "user_id": "user_001",
        "user_name": "Ahmed Raza",
        "station_id": "station_001",
        "service_id": "service_002",
        "from_location": "Rawalpindi",
        "to_location": "Peshawar",
        "travel_date": date_str(-2),   # 2 days ago
        "travel_time": "06:00 AM",
        "seat_count": 2,
        "price": 5000.0,
        "car": "Business Coach — RWP-PEW-04",
        "status": "completed",
        "created_at": ts(5),
    },
    {
        "id": "booking_007",
        "user_id": "user_002",
        "user_name": "Sara Khan",
        "station_id": "station_002",
        "service_id": "service_001",
        "from_location": "Lahore",
        "to_location": "Multan",
        "travel_date": date_str(5),
        "travel_time": "02:00 PM",
        "seat_count": 4,
        "price": 4800.0,
        "car": "Economy Bus — LHR-MLT-09",
        "status": "pending",
        "created_at": ts(0, 1),
    },
    {
        "id": "booking_008",
        "user_id": "user_003",
        "user_name": "Bilal Malik",
        "station_id": "station_003",
        "service_id": "service_001",
        "from_location": "Islamabad",
        "to_location": "Lahore",
        "travel_date": date_str(-5),
        "travel_time": "08:00 AM",
        "seat_count": 1,
        "price": 1200.0,
        "car": "Economy Bus — ISB-LHR-02",
        "status": "cancelled",
        "created_at": ts(8),
    },
]

# ─────────────────────────────────────────────
# SEEDER
# ─────────────────────────────────────────────

def seed_collection(collection_name: str, records: list):
    print(f"\n📦 Seeding '{collection_name}' ({len(records)} records)...")
    col = db.collection(collection_name)
    for record in records:
        doc_id = record.pop("id", None)
        if doc_id:
            col.document(doc_id).set(record)
            print(f"  ✅ {collection_name}/{doc_id}")
        else:
            ref = col.add(record)
            print(f"  ✅ {collection_name}/{ref[1].id} (auto-id)")

def main():
    print("=" * 50)
    print("  Station Hub — Firebase Seeder")
    print("=" * 50)

    if OWNER_ID == "YOUR_FIREBASE_UID":
        print("\n⚠️  WARNING: OWNER_ID is still 'YOUR_FIREBASE_UID'")
        print("   Services won't show in your dashboard until you set your real UID.")
        print("   Find it: Firebase Console → Authentication → Users → copy UID")
        print("   Then edit line 80 of this file and re-run.\n")

    seed_collection("users", USERS)
    seed_collection("stations", STATIONS)
    seed_collection("services", SERVICES)
    seed_collection("bookings", BOOKINGS)

    print("\n🎉 Done! All dummy data inserted into Firestore.")
    print("   Open Firebase Console → Firestore Database to verify.")

if __name__ == "__main__":
    main()
