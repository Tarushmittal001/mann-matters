import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireExpertContext } from "@/lib/expert-data";
import { formatINR } from "@/lib/utils";
import { NOTES_POLICY_COPY, isNotesPolicy } from "@/lib/expert-portal";
import { Chip, Meta, Panel, PanelHeader } from "@/components/expert/Panel";
import ProfileForm from "@/components/expert/ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ExpertProfilePage() {
  const ctx = await requireExpertContext("/expert/profile");
  const { profile, listing } = ctx;
  const policy = NOTES_POLICY_COPY[isNotesPolicy(profile.notesPolicy) ? profile.notesPolicy : "PENDING"];

  return (
    <div className="space-y-6">
      {/* ── what clients see ──────────────────────────────────────────────── */}
      <Panel>
        <PanelHeader
          title="How clients see you"
          hint="A preview of your card in search and matching, built from what is saved below."
        />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 rounded-xl border border-forest-800/10 bg-ivory p-5 sm:flex-row">
            {listing && (
              <Image
                src={listing.photo}
                alt=""
                width={160}
                height={160}
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="font-display text-xl font-medium text-forest-900">{ctx.session.name}</p>
              <p className="mt-0.5 text-[0.86rem] text-ink/65">
                {profile.credentials || "Qualification not set"}
                {profile.experienceYears > 0 && <> · {profile.experienceYears} years</>}
              </p>
              <p className="mt-2.5 text-[0.94rem] leading-relaxed text-ink/80">
                {profile.headline || (
                  <span className="text-ink/45">
                    No headline yet — clients see a blank line where this goes.
                  </span>
                )}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                {profile.specialties.length > 0 ? (
                  profile.specialties.map((s) => <Chip key={s}>{s}</Chip>)
                ) : (
                  <span className="text-[0.84rem] text-ink/45">No focus areas set</span>
                )}
              </div>
              <p className="mt-3 text-[0.84rem] text-ink/60">
                {profile.languages.length > 0
                  ? "Sessions in " + profile.languages.join(", ")
                  : "No session languages set"}
              </p>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-5 max-w-measure whitespace-pre-wrap text-[0.94rem] leading-relaxed text-ink/80">
              {profile.bio}
            </p>
          )}
        </div>
      </Panel>

      {/* ── ours, not yours ───────────────────────────────────────────────── */}
      <Panel>
        <PanelHeader
          title="Set by our team"
          hint="These are fixed here on purpose. Fee and session length are contractual, and note-keeping is a governance decision — write to your practice lead to change any of them."
        />
        <dl className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          <Meta label="Session fee">{listing ? formatINR(listing.price) : "—"}</Meta>
          <Meta label="Session length">{profile.sessionMinutes} minutes</Meta>
          <Meta label="Listing">
            {listing ? "Live in search" : "Not publicly listed"}
          </Meta>
          <Meta label="Note-keeping">{policy.short}</Meta>
        </dl>
        {profile.notesPolicyNote && (
          <p className="px-5 pb-5 text-[0.84rem] text-ink/60 sm:px-6 sm:pb-6">
            {profile.notesPolicyNote}
          </p>
        )}
      </Panel>

      {/* ── the editable part ─────────────────────────────────────────────── */}
      <Panel>
        <PanelHeader
          title="Edit your profile"
          hint="Saved changes reach search and matching immediately. Clients who have already booked keep the session they booked."
        />
        <ProfileForm profile={profile} />
      </Panel>

      <p className="text-[0.84rem] text-ink/55">
        Something wrong that you cannot change here?{" "}
        <Link href="/contact" className="link-draw font-medium text-forest-800">
          Tell the team
        </Link>
        .
      </p>
    </div>
  );
}
