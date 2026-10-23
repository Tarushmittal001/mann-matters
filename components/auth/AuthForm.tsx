"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Alert, CrisisLine, Spinner } from "@/components/ui/Feedback";
import { Field, Select } from "@/components/ui/Field";
import {
  AGE_GUARDIAN_BELOW,
  GENDER_OPTIONS,
  LANGUAGE_OPTIONS,
  ORGANISATION_MAX,
  OTP_LENGTH,
  collect,
  hasErrors,
  ageOn,
  isCalendarDate,
  validateCity,
  validateDateOfBirth,
  validateEmail,
  validateGender,
  validateNamePart,
  validateLanguage,
  validateOrganisation,
  validateOtp,
  validatePassword,
  validateRequiredPhone,
  validateState,
  validateTermsConsent,
  CITY_MAX,
  STATE_OPTIONS,
} from "@/lib/validation";
import { todayIST } from "@/lib/features/booking/policy";
import { useCopy } from "@/lib/i18n/client";
import { authCopy, authMessage } from "@/lib/i18n/auth";

const EASE = [0.22, 1, 0.36, 1] as const;

// Where each role belongs when they haven't asked for somewhere specific. A
// practitioner landing on /dashboard would be shown the client's own booking
// page, which is not their portal and not their job.
const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  EXPERT: "/expert",
};

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { locale, path } = useCopy();
  const a = authCopy(locale);
  // validation and server messages are kept in English in state, exactly as
  // lib/validation.ts and the API return them, and put into Hindi only here,
  // where they are drawn
  const say = (message?: string) => (message ? authMessage(locale, message) : message);
  const rawNext = params.get("next");
  // only ever follow an internal path — an absolute URL here would be an
  // open redirect, and a login page is exactly where that gets abused
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  // signup asks who this is: a service that treats people needs more than an email
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [language, setLanguage] = useState("");
  const [agreed, setAgreed] = useState(false);
  // the SMS code that proves the mobile number, before the account exists
  const [signupCode, setSignupCode] = useState("");
  const [signupPhoneToken, setSignupPhoneToken] = useState("");
  const [devSignupCode, setDevSignupCode] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInMethod, setSignInMethod] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [fields, setFields] = useState<Record<string, string>>({});
  // a message goes as soon as that field is touched again, so a corrected field
  // doesn't keep telling someone off
  const clearField = (key: string) => setFields((f) => (f[key] ? { ...f, [key]: "" } : f));
  const changed = (key: string, set: (v: string) => void) => (v: string) => {
    set(v);
    clearField(key);
  };
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // after a successful signup — the "check your inbox" screen
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  // when login is blocked because the address isn't confirmed yet
  const [needsVerify, setNeedsVerify] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState("");
  // development affordance: when no mail provider is configured the server hands
  // back the verification link so signup isn't a dead end on a fresh machine
  const [devLink, setDevLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(true);

  const isLogin = mode === "login";

  const finishSignIn = (role?: string) => {
    const destination = next === "/dashboard" ? ROLE_HOME[role ?? ""] ?? next : next;
    router.push(destination);
    router.refresh();
  };

  const selectSignInMethod = (method: "email" | "phone") => {
    setSignInMethod(method);
    setFields({});
    setError("");
    setOtp("");
    setOtpRequested(false);
    setDevOtp(null);
  };

  const resend = async (target: string) => {
    setResendNote(a.resend.sending);
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.devLink) {
        setDevLink(data.devLink);
        setResendNote("");
      } else {
        setResendNote(a.resend.sent);
      }
    } catch {
      setResendNote(a.resend.failed);
    }
  };

  const requestPhoneOtp = async () => {
    setSubmitting(true);
    setError("");
    setFields({});
    try {
      const response = await fetch("/api/auth/phone/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 422 && data.fields) setFields(data.fields);
        setError(data.error ?? a.errors.generic);
        return;
      }
      setOtp("");
      setOtpRequested(true);
      setDevOtp(data.devCode ?? null);
    } catch {
      setError(a.errors.network);
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isLogin && signInMethod === "phone") {
      const local = collect([
        ["phone", validateRequiredPhone(phone)],
        ...(otpRequested ? ([['code', validateOtp(otp)]] as [string, string | null][]) : []),
      ]);
      setFields(local);
      if (hasErrors(local)) return;

      if (!otpRequested) {
        await requestPhoneOtp();
        return;
      }

      setSubmitting(true);
      setError("");
      setNeedsVerify(null);
      try {
        const response = await fetch("/api/auth/phone/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code: otp }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 422 && data.fields) setFields(data.fields);
          if (data.needsVerification) setNeedsVerify(data.email ?? null);
          setError(data.error ?? a.errors.generic);
          setSubmitting(false);
          return;
        }

        setOtp("");
        finishSignIn(data.user?.role);
      } catch {
        setError(a.errors.network);
        setSubmitting(false);
      }
      return;
    }

    const signupChecks: [string, string | null][] = isLogin
      ? []
      : [
          ["firstName", validateNamePart(firstName, "first")],
          ["lastName", validateNamePart(lastName, "last")],
          ["dateOfBirth", validateDateOfBirth(dateOfBirth)],
          ["gender", validateGender(gender)],
          ["city", validateCity(city)],
          ["state", validateState(state)],
          ["organisation", validateOrganisation(organisation)],
          ["language", validateLanguage(language)],
          ["phone", validateRequiredPhone(phone)],
          // on login, any password is worth *sending* — telling someone their
          // stored password is too short helps nobody
          ["password", validatePassword(password)],
          ["terms", validateTermsConsent(agreed)],
          ...(signupPhoneToken
            ? ([["phoneCode", validateOtp(signupCode)]] as [string, string | null][])
            : []),
        ];
    const local = collect([...signupChecks, ["email", validateEmail(email)]]);
    setFields(local);
    if (hasErrors(local)) return;

    setSubmitting(true);
    setError("");
    setNeedsVerify(null);

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLogin
            ? { email, password }
            : {
                firstName,
                lastName,
                dateOfBirth,
                gender,
                city,
                state,
                organisation,
                language,
                email,
                phone,
                password,
                acceptTerms: agreed,
                ...(signupPhoneToken ? { phoneToken: signupPhoneToken, phoneCode: signupCode } : {}),
              }
        ),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 422 && data.fields) setFields(data.fields);
        if (isLogin && data.needsVerification) setNeedsVerify(data.email ?? email);
        setError(
          res.status === 422 && data.fields
            ? ""
            : data.error ?? a.errors.generic
        );
        setSubmitting(false);
        return;
      }

      // signup, step one: the code is on its way to their phone
      if (!isLogin && res.status === 202 && data.needsCode) {
        setSignupPhoneToken(data.phoneToken ?? "");
        setSignupCode("");
        setDevSignupCode(data.devPhoneCode ?? null);
        setSubmitting(false);
        return;
      }

      if (!isLogin && data.pendingVerification) {
        setPassword("");
        setPendingEmail(data.email ?? email);
        setEmailSent(data.emailSent !== false);
        setDevLink(data.devLink ?? null);
        setSubmitting(false);
        return;
      }

      setPassword("");
      // an explicit ?next= wins; otherwise send them to their own portal
      finishSignIn(data.user?.role);
    } catch {
      setError(a.errors.network);
      setSubmitting(false);
    }
  };

  return (
    <div lang={locale} className="page-top wrap flex min-h-[70vh] items-center justify-center pb-24">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {pendingEmail ? (
          <div>
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span
                className="font-deva text-sm normal-case tracking-normal text-gold"
                aria-hidden="true"
              >
                मन
              </span>
              {a.pending.eyebrow}
            </p>
            <h1 className="h-display text-4xl">
              {emailSent ? a.pending.titleSent : a.pending.titleNotSent}
            </h1>
            <p className="mt-4 leading-relaxed text-ink/70">
              {emailSent ? (
                <>
                  {a.pending.sentBefore}
                  <span className="font-semibold text-forest-900">{pendingEmail}</span>
                  {a.pending.sentAfter}
                </>
              ) : (
                <>
                  {a.pending.notSentBefore}
                  <span className="font-semibold text-forest-900">{pendingEmail}</span>
                  {a.pending.notSentAfter}
                </>
              )}
            </p>

            {/* development only, read by a developer: stays English */}
            {devLink && (
              <div lang="en" className="mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-5">
                <p className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-gold-dark">
                  Development only
                </p>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-ink/70">
                  No mail provider is configured, so here is the link that would have been
                  emailed. Set <code className="font-mono text-[0.8rem]">GMAIL_USER</code> and{" "}
                  <code className="font-mono text-[0.8rem]">GMAIL_APP_PASSWORD</code> in{" "}
                  <code className="font-mono text-[0.8rem]">.env</code> to send it for real.
                </p>
                <a
                  href={devLink}
                  className="mt-4 inline-flex rounded-full bg-forest-800 px-6 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-700"
                >
                  Confirm my email now
                </a>
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => resend(pendingEmail)}
                className="rounded-full border border-forest-800/20 px-6 py-2.5 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
              >
                {a.pending.resendEmail}
              </button>
              <Link href={path("/login")} className="link-draw text-sm font-medium text-forest-800">
                {a.pending.backToSignIn}
              </Link>
            </div>
            {resendNote && (
              <p role="status" className="mt-4 text-sm text-forest-600">
                {resendNote}
              </p>
            )}
            <p className="mt-8 text-xs leading-relaxed text-ink/70">
              {a.pending.footnote}
            </p>
            <CrisisLine className="mt-10" />
          </div>
        ) : (
          <>
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span
                className="font-deva text-sm normal-case tracking-normal text-gold"
                aria-hidden="true"
              >
                मन
              </span>
              {a.intro[mode].eyebrow}
            </p>
            <h1 className="h-display text-4xl">{a.intro[mode].title}</h1>
            <p className="mt-4 text-ink/70">
              {isLogin
                ? signInMethod === "email"
                  ? a.lede.loginEmail
                  : a.lede.loginPhone
                : a.lede.signup}
            </p>

            {isLogin && (
              <div
                className="mt-7 grid grid-cols-2 rounded-xl bg-forest-800/[0.06] p-1"
                role="group"
                aria-label={a.method.group}
              >
                {(["email", "phone"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => selectSignInMethod(method)}
                    aria-pressed={signInMethod === method}
                    className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition-colors ${
                      signInMethod === method
                        ? "bg-ivory-light text-forest-900 shadow-lift"
                        : "text-ink/70 hover:text-forest-900"
                    }`}
                  >
                    {method === "email" ? a.method.email : a.method.phone}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={onSubmit} className={isLogin ? "mt-6 space-y-4" : "mt-9 space-y-4"} noValidate>
              {!isLogin && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label={a.field.firstName}
                      required
                      value={firstName}
                      onChange={changed("firstName", setFirstName)}
                      autoComplete="given-name"
                      disabled={submitting || !!signupPhoneToken}
                      error={say(fields.firstName)}
                      placeholder={a.field.firstNamePlaceholder}
                    />
                    <Field
                      label={a.field.lastName}
                      required
                      value={lastName}
                      onChange={changed("lastName", setLastName)}
                      autoComplete="family-name"
                      disabled={submitting || !!signupPhoneToken}
                      error={say(fields.lastName)}
                      placeholder={a.field.lastNamePlaceholder}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label={a.field.dateOfBirth}
                      required
                      type="date"
                      value={dateOfBirth}
                      onChange={changed("dateOfBirth", setDateOfBirth)}
                      max={todayIST()}
                      autoComplete="bday"
                      disabled={submitting || !!signupPhoneToken}
                      error={say(fields.dateOfBirth)}
                    />
                    <Select
                      label={a.field.gender}
                      required
                      value={gender}
                      onChange={changed("gender", setGender)}
                      options={GENDER_OPTIONS.map((g) => ({ value: g.value, label: a.gender[g.value] ?? g.label }))}
                      placeholder={a.field.choose}
                      disabled={submitting || !!signupPhoneToken}
                      error={say(fields.gender)}
                    />
                  </div>

                  {/* Optional, and asked here rather than later because it
                      changes who we would match someone with. The list goes
                      beyond what the team currently covers on purpose: a
                      client who wants a language nobody speaks is the most
                      useful thing this field can tell us. */}
                  <Select
                    label={a.field.language}
                    value={language}
                    onChange={changed("language", setLanguage)}
                    // the label is in the reader's language; the value is the
                    // English name the server and the practitioner lists match on
                    options={LANGUAGE_OPTIONS.map((l) => ({ value: l, label: a.languages[l] ?? l }))}
                    placeholder={a.field.noPreference}
                    disabled={submitting || !!signupPhoneToken}
                    error={say(fields.language)}
                    hint={a.field.languageHint}
                  />

                  {isCalendarDate(dateOfBirth) && ageOn(dateOfBirth) < AGE_GUARDIAN_BELOW && (
                    <Alert tone="info">{a.guardianNotice(AGE_GUARDIAN_BELOW)}</Alert>
                  )}

                  <Field
                    label={a.field.mobile}
                    required
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={changed("phone", setPhone)}
                    autoComplete="tel"
                    disabled={submitting || !!signupPhoneToken}
                    error={say(fields.phone)}
                    placeholder="98765 43210"
                    hint={signupPhoneToken ? undefined : a.field.mobileHintSignup}
                  />

                  {/* Where they are. Asked at signup rather than at booking
                      because it decides which practitioners can actually help
                      — language, timezone and, if it ever comes to it, which
                      local crisis service to point to. State is a list so the
                      admin breakdown groups; city is free text because no list
                      of Indian towns is complete enough to turn away a real
                      one. */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label={a.field.city}
                      required
                      value={city}
                      onChange={changed("city", setCity)}
                      autoComplete="address-level2"
                      maxLength={CITY_MAX}
                      disabled={submitting || !!signupPhoneToken}
                      error={say(fields.city)}
                      placeholder={a.field.cityPlaceholder}
                    />
                    <Select
                      label={a.field.state}
                      required
                      value={state}
                      onChange={changed("state", setState)}
                      options={STATE_OPTIONS.map((x) => ({ value: x, label: a.states[x] ?? x }))}
                      placeholder={a.field.choose}
                      disabled={submitting || !!signupPhoneToken}
                      error={say(fields.state)}
                    />
                  </div>

                  <Field
                    label={a.field.organisation}
                    value={organisation}
                    onChange={changed("organisation", setOrganisation)}
                    maxLength={ORGANISATION_MAX}
                    disabled={submitting || !!signupPhoneToken}
                    error={say(fields.organisation)}
                    placeholder="Amity University, Noida"
                    hint={a.field.organisationHint}
                  />
                </>
              )}

              {isLogin && signInMethod === "phone" ? (
                <>
                  <Field
                    label={a.field.mobile}
                    required
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={setPhone}
                    autoComplete="tel"
                    disabled={submitting || otpRequested}
                    error={say(fields.phone)}
                    placeholder="98765 43210"
                    hint={otpRequested ? a.field.otpExpiresHint : a.field.indianOnlyHint}
                  />
                  {otpRequested && (
                    <Field
                      label={a.field.otp}
                      required
                      inputMode="numeric"
                      value={otp}
                      onChange={(value) => setOtp(value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                      autoComplete="one-time-code"
                      disabled={submitting}
                      error={say(fields.code)}
                      placeholder={a.field.otpPlaceholder}
                    />
                  )}
                  {/* development only: stays English */}
                  {devOtp && (
                    <Alert tone="warning">
                      Development code: <strong className="font-mono">{devOtp}</strong>. Configure
                      Twilio environment variables to send it by SMS.
                    </Alert>
                  )}
                </>
              ) : (
                <>
                  <Field
                    label={a.field.email}
                    required
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={changed("email", setEmail)}
                    autoComplete="email"
                    disabled={submitting}
                    error={say(fields.email)}
                    placeholder="you@example.com"
                  />

                  <Field
                    label={a.field.password}
                    required
                    type="password"
                    value={password}
                    onChange={changed("password", setPassword)}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    disabled={submitting}
                    error={say(fields.password)}
                    placeholder={isLogin ? a.field.passwordPlaceholderLogin : a.field.passwordPlaceholderSignup}
                    hint={isLogin ? undefined : a.field.passwordHint}
                  />

                  {!isLogin && signupPhoneToken && (
                    <>
                      <Field
                        label={a.field.codeSentTo(phone.trim())}
                        required
                        inputMode="numeric"
                        value={signupCode}
                        onChange={(v) => changed("phoneCode", setSignupCode)(v.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                        autoComplete="one-time-code"
                        disabled={submitting}
                        error={say(fields.phoneCode)}
                        placeholder={a.field.otpPlaceholder}
                        hint={a.field.signupCodeHint}
                      />
                      {/* development only: stays English */}
                      {devSignupCode && (
                        <Alert tone="warning">
                          Development code: <strong className="font-mono">{devSignupCode}</strong>.
                          Configure Twilio environment variables to send it by SMS.
                        </Alert>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSignupPhoneToken("");
                          setSignupCode("");
                          setDevSignupCode(null);
                          setFields({});
                        }}
                        className="text-sm font-medium text-forest-800 underline underline-offset-4"
                      >
                        {a.changeDetails}
                      </button>
                    </>
                  )}

                  {isLogin && (
                    <p className="-mt-1 text-right">
                      <Link
                        href={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
                        className="hit text-sm font-medium text-forest-800 underline underline-offset-4 hover:text-forest-600"
                      >
                        {a.forgotPassword}
                      </Link>
                    </p>
                  )}
                </>
              )}

              {!isLogin && (
                <div>
                  <label className="flex cursor-pointer items-start gap-3 text-[0.9rem] leading-relaxed text-ink/80">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => {
                        setAgreed(e.target.checked);
                        clearField("terms");
                      }}
                      disabled={submitting || !!signupPhoneToken}
                      aria-invalid={!!fields.terms}
                      aria-describedby={fields.terms ? "terms-error" : undefined}
                      className="mt-1 h-4 w-4 shrink-0 accent-forest-800"
                    />
                    <span>
                      {a.consent.before}
                      {/* new tab, so reading them doesn’t lose what’s typed.
                          The terms and privacy pages are English-only, so the
                          links stay on the English paths. */}
                      <a href="/terms" target="_blank" rel="noopener" className="font-medium text-forest-800 underline underline-offset-2">
                        {a.consent.terms}
                      </a>
                      {a.consent.middle}
                      <a href="/privacy" target="_blank" rel="noopener" className="font-medium text-forest-800 underline underline-offset-2">
                        {a.consent.privacy}
                      </a>
                      {a.consent.after}
                    </span>
                  </label>
                  {fields.terms && (
                    <p id="terms-error" role="alert" className="mt-1.5 pl-7 text-sm text-red-700">
                      {say(fields.terms)}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <Alert tone="error">
                  <p>{say(error)}</p>
                  {needsVerify && (
                    <button
                      type="button"
                      onClick={() => resend(needsVerify)}
                      className="mt-2 font-semibold underline underline-offset-4"
                    >
                      {a.resend.confirmation}
                    </button>
                  )}
                  {resendNote && <p className="mt-2 font-medium">{resendNote}</p>}
                </Alert>
              )}

              <div className="pt-1">
                <Button type="submit" variant="forest" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <Spinner
                      label={
                        isLogin && signInMethod === "phone"
                          ? otpRequested
                            ? a.busy.checkingCode
                            : a.busy.sendingCode
                          : isLogin
                            ? a.busy.signingIn
                            : a.busy.creating
                      }
                    />
                  ) : isLogin && signInMethod === "phone" ? (
                    otpRequested ? a.submit.verifyAndSignIn : a.submit.sendOtp
                  ) : isLogin ? (
                    a.submit.signIn
                  ) : signupPhoneToken ? (
                    a.submit.verifyAndCreate
                  ) : (
                    a.submit.create
                  )}
                </Button>
              </div>

              {isLogin && signInMethod === "phone" && otpRequested && (
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
                  <button
                    type="button"
                    onClick={requestPhoneOtp}
                    disabled={submitting}
                    className="font-medium text-forest-800 underline underline-offset-4"
                  >
                    {a.resendCode}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpRequested(false);
                      setOtp("");
                      setDevOtp(null);
                      setFields({});
                      setError("");
                    }}
                    className="font-medium text-forest-800 underline underline-offset-4"
                  >
                    {a.changeNumber}
                  </button>
                </div>
              )}
            </form>

            <p className="mt-7 text-sm text-ink/70">
              {isLogin ? (
                <>
                  {a.footer.newHere}{" "}
                  <Link
                    href={`${path("/signup")}${rawNext ? `?next=${encodeURIComponent(next)}` : ""}`}
                    className="hit link-draw font-medium text-forest-800"
                  >
                    {a.footer.createAccount}
                  </Link>
                </>
              ) : (
                <>
                  {a.footer.haveAccount}{" "}
                  <Link
                    href={`${path("/login")}${rawNext ? `?next=${encodeURIComponent(next)}` : ""}`}
                    className="hit link-draw font-medium text-forest-800"
                  >
                    {a.footer.signIn}
                  </Link>
                </>
              )}
            </p>

            {!isLogin && (
              <p className="mt-5 text-[0.78rem] leading-relaxed text-ink/70">{a.privacyNote}</p>
            )}

            <CrisisLine className="mt-10" />
          </>
        )}
      </motion.div>
    </div>
  );
}
