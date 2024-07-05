import type { default as mongodb, MongoClient } from 'mongodb'

let connection: MongoClient | undefined = undefined
async function getConnection() {
  if (connection) return connection
  if (!process.env.MONGODB_CONNECTION_STRING) throw new Error('Fill process.env.MONGODB_CONNECTION_STRING')
  const { MongoClient } = await import('mongodb')
  const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING)
  connection = await client.connect()
  return connection
}

export let dbInstance: mongodb.Db | undefined

export default async function getDB(): Promise<mongodb.Db> {
  if (dbInstance) return dbInstance
  const connection = await getConnection()
  dbInstance = connection.db()
  return dbInstance
}