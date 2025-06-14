import { sendBulkEmails } from "@/lib/awsclient";
import { NextResponse } from "next/server";


export async function POST(req) {
  try {
    const body = await req.json();
    const { subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: "Subject and message are required." },
        { status: 400 }
      );
    }

    // 🔁 Your list of recipients (replace this with DB or real data)
    const recipients = [
      "arunpandian972000@gmail.com",
      "velu3prabhakaran@gmail.com",
    ];

    const results = [];

for (const email of recipients) {
  const encodedEmail = encodeURIComponent(email);
  const unsubscribeLink = `http://localhost:3000/subscription/unsubscribe?email=${encodedEmail}`;
  const personalizedHtml = message
    .replace("{{unsubscribe_link}}", unsubscribeLink)
    .replace("{{visible_email}}", email); // this shows proper @ email in text

  const result = await sendBulkEmails([email], subject, personalizedHtml);
  results.push({ email, status: result.status || "sent" });
}


    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (err) {
    console.error("Email sending error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
