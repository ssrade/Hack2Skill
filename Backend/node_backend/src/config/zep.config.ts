import { ZepClient } from "@getzep/zep-cloud";
const API_KEY = process.env.ZEP_API_KEY;


export const client = new ZepClient({
  apiKey: API_KEY,
});