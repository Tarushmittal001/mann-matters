import type { Metadata } from "next";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Book a session",
  description:
    "Book a confidential online session with a licensed psychologist in under five minutes. Choose your concern, expert, and time — from ₹599.",
};

export default function BookPage() {
  return <BookingFlow />;
}
