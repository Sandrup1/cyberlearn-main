import clientPromise from "../../lib/mongodb";
import { defaultCourseContents } from "../../lib/course-content";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("cyberlearn");
    
    // Fetch courses from DB
    const dbCourses = await db.collection("courseContents").find({ published: true }).toArray();
    
    // Merge DB courses with default ones. DB overrides default ones if same moduleId
    const mergedCourses = { ...defaultCourseContents };
    
    for (const course of dbCourses) {
      // Omit _id if it exists
      const { _id, ...courseData } = course || {};
      mergedCourses[courseData.moduleId] = courseData;
    }

    // Convert object to array and ensure they are published
    const coursesArray = Object.values(mergedCourses).filter(course => course.published);
    
    return Response.json(coursesArray);
  } catch (error) {
    console.error("Courses GET Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
