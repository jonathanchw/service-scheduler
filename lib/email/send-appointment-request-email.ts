import { getTranslations } from "next-intl/server";
import { Resend } from "resend";

export type AppointmentRequestEmailInput = {
  locale: string;
  to: string;
  clientName: string;
  serviceName: string;
  requestedStartAt: string;
  timezone: string;
  address: string;
  city: string;
  appointmentUrl: string;
};

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

  if (!apiKey || !from || !appUrl) {
    return null;
  }

  return { apiKey, from, appUrl };
}

function formatDateTime(
  value: string,
  locale: string,
  timezone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendAppointmentRequestEmail(
  input: AppointmentRequestEmailInput,
) {
  const config = getEmailConfig();

  if (!config) {
    console.error(
      "Appointment request email skipped: missing RESEND_API_KEY, EMAIL_FROM, or NEXT_PUBLIC_APP_URL.",
    );
    return;
  }

  try {
    const t = await getTranslations({
      locale: input.locale,
      namespace: "AppointmentRequestEmail",
    });
    const formattedDateTime = formatDateTime(
      input.requestedStartAt,
      input.locale,
      input.timezone,
    );
    const fullAddress = `${input.address}, ${input.city}`;
    const greeting = t("greeting", { name: input.clientName });
    const subject = t("subject");
    const text = [
      greeting,
      "",
      t("intro"),
      "",
      `${t("service")}: ${input.serviceName}`,
      `${t("dateTime")}: ${formattedDateTime}`,
      `${t("address")}: ${fullAddress}`,
      "",
      t("linkIntro"),
      input.appointmentUrl,
      "",
      t("footer"),
    ].join("\n");
    const html = [
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>${escapeHtml(t("intro"))}</p>`,
      "<ul>",
      `<li><strong>${escapeHtml(t("service"))}:</strong> ${escapeHtml(input.serviceName)}</li>`,
      `<li><strong>${escapeHtml(t("dateTime"))}:</strong> ${escapeHtml(formattedDateTime)}</li>`,
      `<li><strong>${escapeHtml(t("address"))}:</strong> ${escapeHtml(fullAddress)}</li>`,
      "</ul>",
      `<p><a href="${escapeHtml(input.appointmentUrl)}">${escapeHtml(t("linkIntro"))}</a></p>`,
      `<p>${escapeHtml(t("footer"))}</p>`,
    ].join("");

    const resend = new Resend(config.apiKey);
    const { error } = await resend.emails.send({
      from: config.from,
      to: input.to,
      subject,
      text,
      html,
    });

    if (error) {
      console.error("Failed to send appointment request email:", error);
    }
  } catch (error) {
    console.error("Failed to send appointment request email:", error);
  }
}

export function buildAppointmentUrl(locale: string, token: string) {
  const config = getEmailConfig();

  if (!config) {
    return null;
  }

  return `${config.appUrl}/${locale}/appointment/${token}`;
}
