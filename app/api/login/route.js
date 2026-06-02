import clientPromise from "../../lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ message: "Missing fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("cyberlearn");

    const normalizedEmail = email.toLowerCase().trim();

    //Find the user
    const user = await db.collection("users").findOne({ email: normalizedEmail });

    if (!user) {
      return Response.json({ message: "Invalid email or password" }, { status: 401 });
    }

    //Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return Response.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // Prepare user response
    const userResponse = {
      name: user.name,
      email: user.email,
    };

    // If the user is admin, add admin specific fields
    if (user.role && user.role.toLowerCase() === "admin") {
      userResponse.role = "Admin";
      userResponse.title = user.title || "System Administrator";
      userResponse.createdAt = user.createdAt;
    }

    //if success
    return Response.json({ 
      message: "Login successful",
      user: userResponse
    }, { status: 200 });

  } catch (error) {
    console.error("Login Error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
