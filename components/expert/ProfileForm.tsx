"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LANGUAGE_OPTIONS,
  MAX_BIO,
  MAX_HEADLINE,
  MAX_LANGUAGES,
  MAX_SPECIALTIES,
  SPECIALTY_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/lib/expert-portal";
import type { ExpertProfileView } from "@/lib/expert-data";
import {
  ChipGroup,
  Field,
  SaveBar,
  Select,
  TextArea,
  TextInput,
} from "@/components/expert/controls";
import { InlineAlert } from "@/components/expert/Panel";
import { send, stampNow } from "@/components/expert/request";
import { useToast } from "@/components/expert/Toast";

type Draft = {
  headline: string;
  bio: string;
  credentials: string;
  experienceYears: string;
  timezone: string;
  specialties: string[];
  languages: string[];
};

function toDraft(profile: ExpertProfileView): Draft {
  return {
    headline: profile.headline,
    bio: profile.bio,
    credentials: profile.credentials,
    experienceYears: String(profile.experienceYears),
    timezone: profile.timezone,
    specialties: [...profile.specialties],
    languages: [...profile.languages],
  };
}

/**
 * How the practitioner is described to clients. Fee, session length and
 * verification are set by our operations team and shown read-only alongside —
 * a form that lets you edit what it will not save is a trap.
 */
export default function ProfileForm({ profile }: { profile: ExpertProfileView }) {
  const router = useRouter();
  const { saved, failed } = useToast();

  const [draft, setDraft] = useState<Draft>(() => toDraft(profile));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const baseline = JSON.stringify(toDraft(profile));
  const dirty = JSON.stringify(draft) !== baseline;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
    setSummary(null);
  };

  const toggle = (key: "specialties" | "languages", value: string) =>
    set(
      key,
      draft[key].includes(value) ? draft[key].filter((v) => v !== value) : [...draft[key], value]
    );

  const save = async () => {
    setBusy(true);
    const result = await send<{ message?: string; fields?: Record<string, string> }>(
      "/api/expert/profile",
      "PATCH",
      { ...draft, experienceYears: Number(draft.experienceYears) }
    );
    setBusy(false);

    if (!result.ok) {
      setErrors(result.data?.fields ?? {});
      setSummary(result.error);
      failed("Profile not saved", result.error);
      return;
    }

    setErrors({});
    setSummary(null);
    setSavedAt(stampNow());
    saved("Profile saved", result.data.message);
    router.refresh();
  };

  return (
    <div className="p-5 sm:p-6">
      {summary && (
        <div className="mb-5">
          <InlineAlert tone="danger" title={summary}>
            <p>The fields below are marked with what needs changing.</p>
          </InlineAlert>
        </div>
      )}

      <div className="space-y-6">
        <Field
          label="Headline"
          required
          error={errors.headline}
          counter={draft.headline.length + " / " + MAX_HEADLINE}
          hint="One line under your name in search results. What you help with, in your own words."
        >
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              maxLength={MAX_HEADLINE}
              value={draft.headline}
              onChange={(e) => set("headline", e.target.value)}
              placeholder="CBT for anxiety and burnout, in Hindi and English"
            />
          )}
        </Field>

        <Field
          label="Introduction"
          required
          error={errors.bio}
          counter={draft.bio.length + " / " + MAX_BIO}
          hint="A short paragraph a nervous first-timer reads before choosing you. Plain language beats credentials here."
        >
          {({ id, describedBy, invalid }) => (
            <TextArea
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              rows={7}
              maxLength={MAX_BIO}
              value={draft.bio}
              onChange={(e) => set("bio", e.target.value)}
            />
          )}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Qualification"
            required
            error={errors.credentials}
            hint="Exactly as it appears on your RCI or council registration."
          >
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                maxLength={140}
                value={draft.credentials}
                onChange={(e) => set("credentials", e.target.value)}
                placeholder="M.Phil. Clinical Psychology, RCI Licensed"
              />
            )}
          </Field>

          <Field label="Years in practice" required error={errors.experienceYears}>
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                type="number"
                min={0}
                max={60}
                inputMode="numeric"
                value={draft.experienceYears}
                onChange={(e) => set("experienceYears", e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field
          label="Your timezone"
          required
          error={errors.timezone}
          hint="Sessions are always shown to you in clinic time (IST) as well. This is only used to work out your quiet hours and to warn you when the two clocks differ."
        >
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={draft.timezone}
              onChange={(e) => set("timezone", e.target.value)}
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <ChipGroup
          legend="Focus areas"
          hint="What our matching tool offers you for. Choose what you genuinely work with, not everything you could."
          options={SPECIALTY_OPTIONS}
          selected={draft.specialties}
          onToggle={(v) => toggle("specialties", v)}
          max={MAX_SPECIALTIES}
          error={errors.specialties}
        />

        <ChipGroup
          legend="Languages you hold sessions in"
          hint="Only the ones you can hold a whole clinical conversation in."
          options={LANGUAGE_OPTIONS}
          selected={draft.languages}
          onToggle={(v) => toggle("languages", v)}
          max={MAX_LANGUAGES}
          error={errors.languages}
        />
      </div>

      <SaveBar
        dirty={dirty}
        busy={busy}
        savedAt={savedAt}
        onSave={save}
        onReset={() => {
          setDraft(toDraft(profile));
          setErrors({});
          setSummary(null);
        }}
        saveLabel="Save profile"
      />
    </div>
  );
}
