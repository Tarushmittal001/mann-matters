import { riskLabel, type IntakeInput } from "@/lib/intake";
import { EmptyState } from "@/components/expert/Panel";

/**
 * The intake form as the practitioner reads it.
 *
 * Read-only, on purpose: these are the client's own words and the practitioner
 * does not get to edit them. Anything the practitioner thinks about them
 * belongs in the session note, which is a separate record with its own history.
 *
 * The risk answer is pulled out of running order and put at the top, because
 * it is the one line that changes what the first ten minutes should be.
 */
export default function IntakeView({
  intake,
  updatedAt,
}: {
  intake: IntakeInput | null;
  updatedAt: string | null;
}) {
  if (!intake) {
    return (
      <div className="p-5 sm:p-6">
        <EmptyState
          title="Not filled in yet"
          body="The client has been asked for it and can complete it any time, including after you meet. Start where you normally would."
        />
      </div>
    );
  }

  const risk = riskLabel(intake.riskSelfHarm);

  const rows: { label: string; value: string }[] = [
    { label: "What brings them", value: intake.reason },
    { label: "How long", value: intake.duration },
    { label: "Care before this", value: intake.pastCare },
    { label: "Medication", value: intake.medication },
    { label: "Physical health", value: intake.medical },
    { label: "In their words, on risk", value: intake.riskNote },
    { label: "Wanted you to know", value: intake.notes },
  ].filter((r) => r.value.trim().length > 0);

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <div
        className={
          risk.urgent
            ? "rounded-xl border border-[#C56A72]/45 bg-[#C56A72]/10 px-4 py-3.5"
            : "rounded-xl border border-forest-800/10 bg-forest-800/[0.03] px-4 py-3.5"
        }
      >
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/70">
          Risk screen
        </p>
        <p
          className={
            risk.urgent
              ? "mt-1 text-[0.95rem] font-semibold text-[#8E3B44]"
              : "mt-1 text-[0.95rem] text-forest-900"
          }
        >
          {risk.label}
        </p>
        {risk.urgent && (
          <p className="mt-1.5 text-[0.83rem] leading-relaxed text-ink/70">
            Self-reported within the last few weeks. Worth opening with, and worth a safety plan
            before the session ends.
          </p>
        )}
      </div>

      <dl className="space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/70">
              {r.label}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-[0.92rem] leading-relaxed text-forest-900">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      {(intake.emergencyName || intake.guardianName) && (
        <div className="space-y-3 border-t border-forest-800/10 pt-5">
          {intake.emergencyName && (
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/70">
                Emergency contact
              </p>
              <p className="mt-1 text-[0.92rem] text-forest-900">
                {intake.emergencyName}
                {intake.emergencyRelation && (
                  <span className="text-ink/70"> ({intake.emergencyRelation})</span>
                )}{" "}
                &middot; {intake.emergencyPhone}
              </p>
            </div>
          )}

          {intake.guardianName && (
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/70">
                Parent or guardian
              </p>
              <p className="mt-1 text-[0.92rem] text-forest-900">
                {intake.guardianName} &middot; {intake.guardianPhone}
              </p>
              <p className="mt-1 text-[0.83rem] leading-relaxed text-ink/65">
                {intake.guardianConsent
                  ? "Consent recorded by the client. Confirm it verbally with the guardian before the first session."
                  : "Consent NOT recorded. Do not begin until you have spoken to the guardian."}
              </p>
            </div>
          )}
        </div>
      )}

      <p className="border-t border-forest-800/10 pt-4 text-[0.8rem] leading-relaxed text-ink/70">
        The client&apos;s own words, last changed {updatedAt ?? "before this booking"}. They can
        edit it at any time, and our admin team cannot read it.
      </p>
    </div>
  );
}
