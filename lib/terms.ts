import { createHash } from "node:crypto";

/**
 * Fourmen Events Photographer Terms & Conditions.
 *
 * To change the terms: edit the text AND raise `version` (e.g. "1.1"). Every photographer is then asked to
 * accept the new version before they can use their dashboard again, and the exact text each person accepted
 * is stored with their acceptance record. Never edit the text without raising the version.
 */
export const TERMS = {
  version: "1.0",
  effective: "2026-10-06",
  title: "Fourmen Events Photographer Terms & Conditions",
  intro:
    "These terms are an agreement between you (the \"Photographer\") and Fourmen Events (\"Fourmen\", \"we\") for offering your photography services to clients through the Fourmen Events platform. Please read them carefully. You must accept them before your photographer profile is activated.",
  sections: [
    {
      title: "Your work and portfolio",
      clauses: [
        "All work you upload must be your own.",
        "Uploaded work must not contain watermarks, logos, phone numbers, social media handles or any other contact details.",
        "Fourmen may remove any photo that breaks these rules.",
        "You give Fourmen a non-exclusive licence to display your portfolio on the platform and in Fourmen promotions.",
        "You keep ownership of your work.",
      ],
    },
    {
      title: "Packages and pricing",
      clauses: [
        "You set your own package prices.",
        "You must add LKR 2,000 to every package price as the Fourmen service charge. Example: if you want to receive LKR 18,000, the package is listed at LKR 20,000.",
      ],
    },
    {
      title: "Payments",
      clauses: [
        "To book a time slot, the client pays a fixed advance of LKR 4,000.",
        "All client payments, including the advance and the remaining balance, are made to Fourmen Events through the platform. Fourmen verifies every payment before any amount is released to you.",
        "Of the advance, LKR 2,000 is retained by Fourmen as its service charge. The remaining LKR 2,000 is remitted to your nominated bank account once the advance has been verified.",
        "The remaining balance is paid by the client through the platform, before or after the shoot. Once Fourmen has verified the balance payment, the full balance is remitted to your nominated bank account. Fourmen makes no further deduction from the balance.",
        "Remittances are made manually by bank transfer within a reasonable time after verification. Please ask clients to pay through the platform, so that every payment is verified and recorded and the booking stays protected.",
        "You must keep the payout bank details in your dashboard accurate and up to date. Fourmen is not responsible for transfers made to incorrect details that you provided.",
      ],
    },
    {
      title: "Identity, contact details and booking protection",
      clauses: [
        "To protect the Fourmen booking process, your personal contact details and identifying information stay confidential until approximately two weeks before the scheduled event. This protects confirmed bookings, ensures proper coordination through Fourmen, and prevents direct arrangements outside the platform. Until then, clients see your stage name.",
        "Fourmen does not hide your brand permanently. About two weeks before the event, your brand identity and contact details are revealed to the client, and you and the client are notified, so the client can contact you directly.",
        "Fourmen handles the initial booking and coordination between you and the client. Once your details are shared, Fourmen will not unnecessarily interfere with your direct communication or professional relationship with the client, except where coordination or help is needed to deliver the agreed service.",
      ],
    },
    {
      title: "Time slots and bookings",
      clauses: [
        "You will only add time slots that you can truly shoot. Slots are booked first come, first served.",
        "A confirmed booking is a commitment. If you cannot attend, you must tell Fourmen as early as possible so that Fourmen can arrange for the client.",
        "Repeated cancellations or no-shows may lead to removal from the platform.",
      ],
    },
    {
      title: "Delivery and feedback",
      clauses: [
        "Fourmen recommends delivering each client's edited photos and videos within two weeks of the shoot, shared through the platform.",
        "Edited photos must be of the standard shown in your portfolio and include what the client's package promises.",
        "Clients can leave feedback through the platform. Feedback may be considered when allocating future bookings.",
      ],
    },
    {
      title: "Client privacy",
      clauses: [
        "You will use client details only to deliver the booked service, keep them confidential, and not share them with anyone else.",
        "You will not use client photos for your own promotion without the client's permission.",
      ],
    },
    {
      title: "Fair use of the platform",
      clauses: [
        "Bookings made through Fourmen remain subject to the Fourmen service charge, even if the client contacts you directly after your details are revealed.",
        "You will not use the platform to move bookings away from Fourmen to avoid the service charge.",
        "You will treat every client professionally and respectfully.",
      ],
    },
    {
      title: "Suspension and ending this agreement",
      clauses: [
        "Fourmen may suspend or remove listings that break this Agreement.",
        "Either party may end this Agreement by written notice. Confirmed bookings must still be honoured.",
      ],
    },
    {
      title: "Responsibility and disputes",
      clauses: [
        "You are responsible for your own equipment, conduct and the services you deliver to clients.",
        "If a disagreement arises between you and Fourmen, both parties will first try to resolve it in good faith by discussion.",
      ],
    },
    {
      title: "General",
      clauses: [
        "You are an independent photographer and not an employee of Fourmen.",
        "This Agreement is governed by the laws of Sri Lanka.",
        "This is the full agreement between the parties. Changes must be agreed in writing. If Fourmen updates these terms, you will be asked to accept the new version in your dashboard before continuing, and that acceptance counts as written agreement. Changes do not affect bookings already confirmed.",
        "When you accept, Fourmen records your name, email, the date and time, your IP address and the exact version of these terms you accepted, as a record of this Agreement.",
      ],
    },
  ],
} as const;

/** The full terms as plain text, numbered: the exact wording stored with every acceptance. */
export function termsText() {
  const lines = [`${TERMS.title}`, `Version ${TERMS.version}, effective ${TERMS.effective}`, "", TERMS.intro, ""];
  TERMS.sections.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.title.toUpperCase()}`);
    s.clauses.forEach((c, j) => lines.push(`${i + 1}.${j + 1} ${c}`));
    lines.push("");
  });
  return lines.join("\n").trim();
}

/** Fingerprint of the exact text, so an acceptance can be matched to the wording that was shown. */
export const termsHash = () => createHash("sha256").update(termsText()).digest("hex");
