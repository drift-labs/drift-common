import { PrettyError } from 'src/types';

const PhantomErrors: Record<number, PrettyError> = {
	[4900]: {
		code: 4900,
		name: `Disconnected`,
		msg: `Phantom could not connect to the network.`,
	},
	[4100]: {
		code: 4100,
		name: `Unauthorized`,
		msg: `The requested method and/or account has not been authorized by the user.`,
	},
	[4001]: {
		code: 4001,
		name: `User Rejected Request`,
		msg: `The user rejected the request through Phantom.`,
	},
	[-32000]: {
		code: -32000,
		name: `Invalid Input`,
		msg: `Missing or invalid parameters.`,
	},
	[-32002]: {
		code: -32002,
		name: `Requested resource not available`,
		msg: `This error occurs when a dapp attempts to submit a new transaction while Phantom's approval dialog is already open for a previous transaction.`,
	},
	[-32003]: {
		code: -32003,
		name: `Transaction Rejected`,
		msg: `Phantom does not recognize a valid transaction.`,
	},
	[-32601]: {
		code: -32601,
		name: `Method Not Found`,
		msg: `Phantom does not recognize the method.`,
	},
	[-32603]: {
		code: -32603,
		name: `Internal Error`,
		msg: `Something went wrong within Phantom.`,
	},
};

export default PhantomErrors;
