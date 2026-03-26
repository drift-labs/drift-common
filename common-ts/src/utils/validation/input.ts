import { SpotMarketConfig } from '@drift-labs/sdk';

const formatTokenInputCurried =
	(setAmount: (amount: string) => void, spotMarketConfig: SpotMarketConfig) =>
	(newAmount: string) => {
		if (isNaN(+newAmount)) return;

		if (newAmount === '') {
			setAmount('');
			return;
		}

		const lastChar = newAmount[newAmount.length - 1];

		// if last char of string is a decimal point, don't format
		if (lastChar === '.') {
			setAmount(newAmount);
			return;
		}

		if (lastChar === '0') {
			// if last char of string is a zero in the decimal places, cut it off if it exceeds precision
			const numOfDigitsAfterDecimal = newAmount.split('.')[1]?.length ?? 0;
			if (numOfDigitsAfterDecimal > spotMarketConfig.precisionExp.toNumber()) {
				setAmount(newAmount.slice(0, -1));
			} else {
				setAmount(newAmount);
			}
			return;
		}

		const formattedAmount = Number(
			(+newAmount).toFixed(spotMarketConfig.precisionExp.toNumber())
		);
		setAmount(formattedAmount.toString());
	};

export { formatTokenInputCurried };
