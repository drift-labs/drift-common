import { PublicKey } from '@drift-labs/sdk';
import bcrypt from 'bcryptjs-react';
import nacl, { sign } from 'tweetnacl';

const getSignatureVerificationMessageForSettings = (
	authority: PublicKey,
	signTs: number
): Uint8Array => {
	return new TextEncoder().encode(
		`Verify you are the owner of this wallet to update trade settings: \n${authority.toBase58()}\n\nThis signature will be valid for the next 30 minutes.\n\nTS: ${signTs.toString()}`
	);
};

const verifySignature = (
	signature: Uint8Array,
	message: Uint8Array,
	pubKey: PublicKey
): boolean => {
	return sign.detached.verify(message, signature, pubKey.toBytes());
};

const hashSignature = async (signature: string): Promise<string> => {
	bcrypt.setRandomFallback((num: number) => {
		return Array.from(nacl.randomBytes(num));
	});
	const hashedSignature = await bcrypt.hash(signature, bcrypt.genSaltSync(10));
	return hashedSignature;
};

const compareSignatures = async (
	original: string,
	hashed: string
): Promise<boolean> => {
	const signaturesMatch = await bcrypt.compare(original, hashed);
	return signaturesMatch;
};

export {
	getSignatureVerificationMessageForSettings,
	verifySignature,
	hashSignature,
	compareSignatures,
};
