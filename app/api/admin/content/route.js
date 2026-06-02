import clientPromise from "../../../lib/mongodb";
import {
  defaultCourseContents,
  moduleIds,
} from "../../../lib/course-content";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("cyberlearn");
    const savedContents = await db
      .collection("courseContents")
      .find({})
      .toArray();

    const mergedContents = { ...defaultCourseContents };
    
    for (const content of savedContents) {
      const { _id, ...cleanContent } = content || {};
      mergedContents[cleanContent.moduleId] = cleanContent;
    }

    return Response.json(Object.values(mergedContents));
  } catch (error) {
    console.error("Admin content lookup failed:", error);
    return Response.json(Object.values(defaultCourseContents));
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const moduleId = data.moduleId;

    if (!moduleId || typeof moduleId !== 'string') {
      return Response.json({ error: "Missing or invalid moduleId in payload" }, { status: 400 });
    }

    // Basic validation
    if (!data.title || !data.sections || !data.labs) {
      return Response.json({ error: "Missing required course fields (title, sections, labs)" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("cyberlearn");
    
    // Replace if exists, or insert new
    await db.collection("courseContents").replaceOne(
      { moduleId },
      data,
      { upsert: true }
    );

    return Response.json({ success: true, message: "Course saved successfully" });
  } catch (error) {
    console.error("Admin Course POST Error:", error);
    return Response.json({ error: "Failed to save course" }, { status: 500 });
  }
}
