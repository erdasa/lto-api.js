import { Cypher } from "../Cypher"
import {IKeyPairBytes} from "../../../interfaces";
import * as crypto from "../../utils/crypto";
import * as nacl from "tweetnacl";
import ed2curve from "../../libs/ed2curve";

export class ED25519 extends Cypher {
	private sign: IKeyPairBytes;
	private encrypt?: IKeyPairBytes;

	constructor(sign: IKeyPairBytes, encrypt?: IKeyPairBytes) {
		super('ed25519');

		if (!encrypt) encrypt =	{
			privateKey: sign.privateKey ? ed2curve.convertSecretKey(sign.privateKey) : undefined,
			publicKey: ed2curve.convertSecretKey(sign.publicKey)
		};

		this.sign = sign;
		this.encrypt = encrypt;
    }

	public encryptMessage(input: Uint8Array, theirPublicKey: Uint8Array): Uint8Array {
		if (!this.encrypt.privateKey)
			throw new Error("Missing private key for encryption");

		const nonce = crypto.randomNonce();

		return crypto.mergeTypedArrays(nacl.box(input, nonce, theirPublicKey, this.sign.privateKey), nonce);
	}

	public decryptMessage(cypher: Uint8Array, theirPublicKey: Uint8Array): Uint8Array {
		const message = cypher.slice(0, -24);
		const nonce = cypher.slice(-24);

		return nacl.box.open(message, nonce, theirPublicKey, this.sign.privateKey);
	}

	public createSignature(input: Uint8Array): Uint8Array {
		if (!this.sign.privateKey)
			throw new Error("Missing private key for signing");

		return nacl.sign.detached(input, this.sign.privateKey);
	}

	public verifySignature(input: Uint8Array, signature: Uint8Array): boolean {
		return nacl.sign.detached.verify(input, signature, this.sign.publicKey);
	}
}
