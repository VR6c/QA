import app, { connectMongo } from '../backend/src/app.js';

export default async function handler(req, res) {
  await connectMongo();
  return app(req, res);
}
