/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require('mongodb');

async function inspectDB() {
  const uri = 'mongodb://sandrup:sandrup@ac-uquxppz-shard-00-00.rpcvhqm.mongodb.net:27017,ac-uquxppz-shard-00-01.rpcvhqm.mongodb.net:27017,ac-uquxppz-shard-00-02.rpcvhqm.mongodb.net:27017/?ssl=true&replicaSet=atlas-11nf51-shard-0&authSource=admin&appName=Cluster0';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('cyberlearn');
    console.log('Database Name: cyberlearn');
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      console.log('\n--- Collection: ' + col.name + ' ---');
      const docs = await db.collection(col.name).find({}).limit(1).toArray();
      console.log(JSON.stringify(docs, null, 2));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

inspectDB();
