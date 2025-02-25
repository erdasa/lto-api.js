import Transaction from "./transactions/Transaction";
import {from as txFromData} from "./transactions";
import axios from "axios";
import {ITxJSON} from "../interfaces";
import LTORequestError from "./errors/LTORequestError";

export class PublicNode {
	public readonly url: string;
	public readonly apiKey: string;

	constructor(url: string, apiKey?: string) {
		this.url = url;
		this.apiKey = apiKey;
	}

	public async post(endpoint: string, postData: string, headers = {}): Promise<any> {
		if (this.apiKey) headers["X-API-Key"] = this.apiKey;
		headers["content-type"] = "application/json";

		const response = await axios.post(endpoint, postData, {baseURL: this.url, headers})
			.catch(error => { throw new LTORequestError(this.url.concat(endpoint), error.response.data) });

		return response.data;
	}

	public async get(endpoint: string, headers = {}): Promise<any> {
		if (this.apiKey) headers["X-API-Key"] = this.apiKey;

		const response = await axios.get(endpoint, {baseURL: this.url, headers})
			.catch(error => { throw new LTORequestError(this.url.concat(endpoint), error.response.data) });

		return response.data;
	}

	async broadcast<T extends Transaction>(transaction: T): Promise<T> {
		const data = await this.post("/transactions/broadcast", JSON.stringify(transaction.toJson()));
		return txFromData(data as ITxJSON) as T;
	}

	public nodeStatus(): Promise<{blockchainHeight: number, stateHeight: number, updatedTimestamp: number, updatedDate: string}> {
		return this.get("/node/status");
	}

	public nodeVersion(): Promise<{version: string}> {
		return this.get("/node/version");
	}

	public getBalance(address: string): Promise<{address: string, confirmations: number, balance: number}> {
		return this.get(`/addresses/balance/${address}`);
	}
}
