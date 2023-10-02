const path = require('path');
const fs = require('fs');

const SOLSCAN_ANCHOR_API_ENDPOINT = 'https://api.solscan.io/anchor/anchor_idl';

const JUP_V6_CONFIG = {
	filePath: path.join(__dirname, '..', 'jup-v6-error-codes.json'),
	programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
};
const JUP_V4_CONFIG = {
	filePath: path.join(__dirname, '..', 'jup-v4-error-codes.json'),
	programId: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
};

const fetchProgramErrors = async (programConfig) => {
	const response = await fetch(
		`${SOLSCAN_ANCHOR_API_ENDPOINT}?program_address=${programConfig.programId}`
	);
	const data = await response.json();

	const errors = data.data.errors;
	saveErrorCodes(errors, programConfig);
};

const saveErrorCodes = (errors, programConfig) => {
	const errorsConfig = {
		programId: programConfig.programId,
		errorsList: {},
		errorCodesMap: {},
	};

	errors.forEach((err) => {
		errorsConfig.errorCodesMap[err.code] = err.name;
		errorsConfig.errorsList[err.name] = err;
	});

	fs.writeFileSync(
		programConfig.filePath,
		`${JSON.stringify(errorsConfig, null, '	')}\n`
	);
};

fetchProgramErrors(JUP_V6_CONFIG);
fetchProgramErrors(JUP_V4_CONFIG);
