import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(
  req,
  context
) {
  try {
    const { id } = await context.params;

    const client = await clientPromise;
    const db = client.db("cyberlearn");

    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      });
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Error deleting user",
      error,
    });
  }
}
