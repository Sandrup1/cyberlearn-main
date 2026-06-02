/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const uriMatch = envContent.match(/MONGODB_URI=(.*)/);

if (!uriMatch) {
  console.error("MONGODB_URI is not set in .env.local");
  process.exit(1);
}

const uri = uriMatch[1];

async function setup() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB.");

    const db = client.db("cyberlearn");

    // Check if the collection exists
    const collections = await db.listCollections({ name: "progress" }).toArray();

    if (collections.length === 0) {
      console.log("Creating 'progress' collection...");
      await db.createCollection("progress");
      console.log("'progress' collection created successfully.");
    } else {
      console.log("'progress' collection already exists.");
    }

    // Create a unique index on email to optimize queries and prevent duplicates
    console.log("Creating unique index on 'email' field...");
    await db.collection("progress").createIndex({ email: 1 }, { unique: true });
    console.log("Index created successfully.");

  } catch (error) {
    console.error("Error setting up progress collection:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB.");
  }
}

setup();
