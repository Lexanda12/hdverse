import crypto from 'crypto';
import axios from 'axios';
import { logger } from './logger';

const FREETSA_URL = process.env.FREETSA_URL || 'https://freetsa.org/tsr';

/**
 * Creates a minimal RFC 3161 timestamp request for a given hash.
 * Sends it to FreeTSA and returns the base64-encoded TSR response.
 */
export async function createTimestamp(fileHash: string): Promise<string> {
  // Build a minimal TSQ (TimeStamp Query) in DER format
  // OID for SHA-256: 2.16.840.1.101.3.4.2.1
  const sha256Oid = Buffer.from([
    0x30, 0x0d,
    0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01,
    0x05, 0x00,
  ]);

  const hashBytes = Buffer.from(fileHash, 'hex');

  // MessageImprint ::= SEQUENCE { hashAlgorithm AlgorithmIdentifier, hashedMessage OCTET STRING }
  const messageImprint = Buffer.concat([
    Buffer.from([0x30, sha256Oid.length + hashBytes.length + 4]),
    sha256Oid,
    Buffer.from([0x04, hashBytes.length]),
    hashBytes,
  ]);

  // Nonce (8 random bytes as INTEGER)
  const nonceBytes = crypto.randomBytes(8);
  const nonce = Buffer.concat([
    Buffer.from([0x02, nonceBytes.length]),
    nonceBytes,
  ]);

  // Version INTEGER 1
  const version = Buffer.from([0x02, 0x01, 0x01]);

  // certReq BOOLEAN TRUE
  const certReq = Buffer.from([0x01, 0x01, 0xff]);

  // TimeStampReq SEQUENCE
  const tsqContent = Buffer.concat([version, messageImprint, nonce, certReq]);
  const tsq = Buffer.concat([
    Buffer.from([0x30, tsqContent.length]),
    tsqContent,
  ]);

  logger.info({ hashLength: fileHash.length }, 'Sending timestamp request to FreeTSA');

  const response = await axios.post(FREETSA_URL, tsq, {
    headers: {
      'Content-Type': 'application/timestamp-query',
      'Accept': 'application/timestamp-reply',
    },
    responseType: 'arraybuffer',
    timeout: 15000,
  });

  if (response.status !== 200) {
    throw new Error(`FreeTSA returned status ${response.status}`);
  }

  const tsrBuffer = Buffer.from(response.data);
  const tsrBase64 = tsrBuffer.toString('base64');

  logger.info('Timestamp received from FreeTSA');
  return tsrBase64;
}
