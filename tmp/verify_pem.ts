
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const rawKey = process.env.FIREBASE_PRIVATE_KEY;
console.log('Raw Key present:', !!rawKey);

if (rawKey) {
  const privateKey = rawKey.trim().replace(/^"|"$/g, '').replace(/\\n/g, "\n").replace(/\n+/g, "\n");
  console.log('Parsed Key starts with valid header:', privateKey.startsWith('-----BEGIN PRIVATE KEY-----'));
  console.log('Parsed Key ends with valid footer:', privateKey.endsWith('-----END PRIVATE KEY-----\n') || privateKey.endsWith('-----END PRIVATE KEY-----'));
  
  const lines = privateKey.split('\n');
  console.log('Number of lines:', lines.length);
  
  // Log first and last line (headers)
  console.log('First line:', lines[0]);
  console.log('Last line:', lines[lines.length - 1] || lines[lines.length - 2]);
}
