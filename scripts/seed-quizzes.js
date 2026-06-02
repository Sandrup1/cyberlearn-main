import { MongoClient } from "mongodb";
import { fallbackQuizzes } from "../app/lib/quizzes.js";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("Please add your Mongo URI to .env.local");
  process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to server");

    const db = client.db("cyberlearn");
    const collection = db.collection("quizzes");

    // Clear existing quizzes
    await collection.deleteMany({});
    console.log("Cleared existing quizzes");

    // Insert new quizzes from fallback
    const quizzesToInsert = Object.values(fallbackQuizzes);
    const result = await collection.insertMany(quizzesToInsert);
    
    console.log(`Successfully inserted ${result.insertedCount} quizzes`);

  } finally {
    await client.close();
    console.log("Database connection closed");
  }
}

run().catch(console.dir);
