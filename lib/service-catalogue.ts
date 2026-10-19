import { listExperts } from "@/lib/experts-store";
import { priceForExpertService, priceRangeForService, services, type Service } from "@/lib/services";

/** Re-exported so server callers have one place to reach for catalogue facts. */
export {
  concernForService,
  fromPriceForExpert,
  priceForExpertService,
  priceRangeForService,
  serviceForConcern,
  servicesForExpert,
} from "@/lib/services";
import type { Expert } from "@/lib/experts";

/**
 * The join between what we sell and who can deliver it.
 *
 * This did not exist, and its absence was the bug underneath a lot of others.
 * The catalogue listed fourteen services with prices; the booking flow asked
 * for one of six "concerns"; the charge came from the *therapist's* rate. So a
 * card could advertise ₹399 while the cheapest thing anybody could actually
 * buy was ₹849, and somebody wanting a psychiatrist could book a psychologist
 * without either of them being told.
 *
 * Three rules now hold everywhere:
 *
 *   1. **The service sets the price, and a practitioner may set their own.**
 *      A session costs what its service costs, unless that practitioner has an
 *      override for it. `Expert.price` — one flat rate per therapist — is
 *      historical and is never charged. The absence of an override is not a
 *      gap: it means the standard price, so ticking a service is enough to
 *      make it sellable.
 *   2. **A service is only bookable if somebody is qualified to deliver it.**
 *      An empty provider list means not bookable — never "anyone will do".
 *   3. **The service travels with the booking.** `Booking.serviceSlug` records
 *      what was actually sold.
 */

export function serviceBySlug(slug: string): Service | null {
  return services.find((s) => s.slug === slug) ?? null;
}


/**
 * What to charge for one practitioner taking one service.
 *
 * The booking route's only source of a number. It looks the practitioner up
 * here rather than trusting one passed in, because the request that names the
 * therapist is the same request that would like the session to be cheaper.
 *
 * Returns null when the pair cannot be priced — an unknown practitioner, or a
 * service that is priced on request — and the caller refuses the booking
 * rather than falling back to anything.
 */
export async function priceForBooking(expertId: string, slug: string): Promise<number | null> {
  const expert = (await listExperts()).find((e) => e.id === expertId);
  if (!expert) return null;
  return priceForExpertService(expert, slug);
}

export type ServiceAvailability = {
  service: Service;
  /** Practitioners qualified for it, in catalogue order. */
  experts: Expert[];
  bookable: boolean;
  /** What it costs across those practitioners; null when none of them is priced. */
  priceRange: { min: number; max: number } | null;
};

/**
 * Every service with the practitioners who can deliver it.
 *
 * A service nobody is qualified for comes back with an empty list and
 * `bookable: false`. That is a real answer, not a gap to paper over: we sell a
 * psychiatry consultation and employ no psychiatrist, and the honest thing is
 * for the site to stop offering it until that is true.
 */
export async function serviceAvailability(): Promise<ServiceAvailability[]> {
  // listExperts() returns ACTIVE listings only, which is what makes the range
  // below honest: its floor is a price somebody can actually be booked at
  const experts = await listExperts();
  return services.map((service) => {
    const offered = experts.filter((e) => e.services.includes(service.slug));
    return {
      service,
      experts: offered,
      bookable: offered.length > 0,
      priceRange: priceRangeForService(service.slug, offered),
    };
  });
}

/** The practitioners who can take this service. Empty means nobody. */
export async function expertsForService(slug: string): Promise<Expert[]> {
  const experts = await listExperts();
  return experts.filter((e) => e.services.includes(slug));
}

/** Can this person be booked for this service? The booking route's gate. */
export async function expertOffersService(expertId: string, slug: string): Promise<boolean> {
  const experts = await expertsForService(slug);
  return experts.some((e) => e.id === expertId);
}

