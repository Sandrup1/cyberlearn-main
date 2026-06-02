import clientPromise from "../../../lib/mongodb";
import {
  getDefaultCourseContent,
} from "../../../lib/course-content";

export const dynamic = "force-dynamic";

function sanitizeContent(content) {
  return {
    ...content,
    moduleId: content.moduleId,
    sections: content.sections || [],
    labs: content.labs || [],
  };
}

export async function GET(
  _req,
  context
) {
  const { moduleId } = await context.params;

  try {
    const client = await clientPromise;
    const db = client.db("cyberlearn");
    const content = await db
      .collection("courseContents")
      .findOne({ moduleId: moduleId, published: true });

    if (content) {
      // Remove _id from db result
      const { _id, ...cleanContent } = content || {};
      return Response.json(sanitizeContent(cleanContent));
    }
  } catch (error) {
    console.error("Course content lookup failed:", error);
  }

  // Fallback
  const fallbackContent = getDefaultCourseContent(moduleId);
  if (!fallbackContent) {
    return Response.json({ error: "Module not found" }, { status: 404 });
  }

  return Response.json(sanitizeContent(fallbackContent));
}
