const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const match = env.match(/MONGODB_URI=(.*)/);
if (match) {
  process.env.MONGODB_URI = match[1].trim();
}

const clientPromise = require('../app/lib/mongodb').default;
clientPromise.then(async (client) => {
  const db = client.db('cyberlearn');
  const contents = await db.collection('courseContents').find({}).toArray();
  console.log(JSON.stringify(contents.map(c => ({
    moduleId: c.moduleId,
    title: c.title,
    shortTitle: c.shortTitle,
    published: c.published,
    sections: c.sections,
    labs: c.labs
  })), null, 2));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
