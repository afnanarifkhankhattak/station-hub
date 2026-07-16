import unittest

from services.booking_events import BookingEventManager


class BookingEventManagerTests(unittest.TestCase):
    def test_emits_expected_payload_for_every_booking_state(self):
        manager = BookingEventManager()
        for status in ("pending", "confirmed", "rejected", "cancelled", "completed"):
            with self.subTest(status=status):
                event = manager.publish("user-1", "booking-1", status)
                self.assertEqual(event["type"], "booking_status_change")
                self.assertEqual(event["booking_id"], "booking-1")
                self.assertEqual(event["new_status"], status)
                self.assertTrue(event["timestamp"])
                self.assertTrue(event["message"])
                self.assertIn(status, event["event_id"])


if __name__ == "__main__":
    unittest.main()
