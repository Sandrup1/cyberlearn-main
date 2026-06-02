import clientPromise from "../../../../lib/mongodb";
import {
  getDefaultCourseContent,
} from "../../../../lib/course-content";

export const dynamic = "force-dynamic";

function normalizeUpdate(existingContent, moduleId, update) {
  const baseContent = existingContent || getDefaultCourseContent(moduleId);

  if (!baseContent && (!update.title || !update.description)) {
    throw new Error("Module not found and insufficient data to create new");
  }

  return {
    ...baseContent,
    ...update,
    moduleId: moduleId,
    sections: Array.isArray(update.sections)
      ? update.sections
      : (baseContent?.sections || []),
    labs: Array.isArray(update.labs) ? update.labs : (baseContent?.labs || []),
    published: update.published ?? (baseContent?.published || false),
    updatedAt: new Date().toISOString(),
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
      .findOne({ moduleId });

    if (content) {
      const { _id, ...cleanContent } = content || {};
      return Response.json(cleanContent);
    }
  } catch (error) {
    console.error("Admin content lookup failed:", error);
  }

  const fallbackContent = getDefaultCourseContent(moduleId);
  if (!fallbackContent) {
    return Response.json({ error: "Module not found" }, { status: 404 });
  }

  return Response.json(fallbackContent);
}

export async function PUT(
  req,
  context
) {
  try {
    const { moduleId } = await context.params;
    const body = await req.json();
    
    const client = await clientPromise;
    const db = client.db("cyberlearn");
    
    const existingContent = await db
      .collection("courseContents")
      .findOne({ moduleId });

    const { _id, ...existingClean } = existingContent || {};

    const content = normalizeUpdate(
      existingContent ? existingClean : null,
      moduleId, 
      body
    );

    await db
      .collection("courseContents")
      .updateOne(
        { moduleId: content.moduleId },
        { $set: content },
        { upsert: true }
      );

    return Response.json({
      message: "Content saved",
      content,
    });
  } catch (error) {
    console.error("Admin content save failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save content" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req,
  context
) {
  try {
    const { moduleId } = await context.params;
    const client = await clientPromise;
    const db = client.db("cyberlearn");
    
    await db.collection("courseContents").deleteOne({ moduleId });

    return Response.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Admin Course DELETE Error:", error);
    return Response.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
