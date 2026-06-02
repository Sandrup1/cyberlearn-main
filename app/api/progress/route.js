import clientPromise from "../../lib/mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("cyberlearn");
    
    const progressDoc = await db.collection("progress").findOne({ email });

    if (!progressDoc) {
      return Response.json({ progress: {} }, { status: 200 });
    }

    return Response.json(
      {
        progress: progressDoc.progress || {},
        performance: progressDoc.performance || {},
        updatedAt: progressDoc.updatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Progress Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { email, progress, performance } = await req.json();

    if (!email) {
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("cyberlearn");

    if (!progress && !performance) {
      return Response.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    const setPatch = {
      updatedAt: new Date().toISOString(),
    };
    if (progress) setPatch.progress = progress;
    if (performance) setPatch.performance = performance;

    await db.collection("progress").updateOne(
      { email },
      { $set: setPatch },
      { upsert: true }
    );

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("POST Progress Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
