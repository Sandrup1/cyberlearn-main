import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const db = client.db("cyberlearn");

  const users = await db.collection("users").find().toArray();

  return NextResponse.json(users);
}
