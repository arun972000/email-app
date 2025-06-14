import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req) {
  try {
    const { pathname } = new URL(req.url);
    const email = decodeURIComponent(pathname.split("/").pop());

    const [result] = await db.execute(
      `UPDATE emails SET subscribe = 1 - subscribe WHERE email = ?`,
      [email]
    );

    return NextResponse.json({ message: "email status updated successfully" });
  } catch (err) {
    console.error("Toggle error:", err);
    return NextResponse.json({ message: "failed to update status" });
  }
}
