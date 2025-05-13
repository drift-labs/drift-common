import {
	BN,
	QUOTE_PRECISION,
	AMM_RESERVE_PRECISION,
	BigNum,
} from '@drift-labs/sdk';

/**
 * Utilities to convert numbers and BigNumbers (BN) to different formats for the UI.
 */
export class NumLib {
	private static locale = 'en';

	static setLocale = (locale: string) => {
		this.locale = locale;
	};

	/**
	 * Converts a Big Number to its regular number representation.
	 *
	 * This won't work when the precision, or bn/precision is larger than MAX_SAFE_INTEGER .. This shouldn't happen though unless using extremely large numbers
	 * */
	private static toRawNum = (
		bn: BN,
		precision: BN,
		fixedAccuracity?: number
	) => {
		if (!bn) return 0;

		if (bn.lt(precision)) {
			try {
				return bn.toNumber() / precision.toNumber();
			} catch {
				const numScale = new BN(1000);
				return bn.div(precision.div(numScale)).toNumber() / numScale.toNumber();
			}
		}

		let rawValue =
			bn.div(precision).toNumber() +
			bn.mod(precision).toNumber() / precision.toNumber();

		if (fixedAccuracity) {
			rawValue = parseFloat(rawValue.toFixed(fixedAccuracity));
		}

		return rawValue;
	};

	static formatNum = {
		/**
		 * Converts a number to a precision suitable to trade with
		 * @param num
		 * @returns
		 */
		toTradePrecision: (num: number) => {
			return parseFloat(num.toPrecision(6));
		},
		toTradePrecisionString: (num: number, toLocaleString?: boolean) => {
			if (num === 0)
				return Number(0).toLocaleString(this.locale, {
					minimumSignificantDigits: 6,
					maximumSignificantDigits: 6,
				});

			// slice numbers which have leading 0s so that numbers are only 6 digits long.
			//// trimAmount will be 1 for 0.1 -> 0.999, 2 for 0.01 -> 0.0999, etc.
			//// Handle num = 0 edge case .. (log10(0) = infinity)
			const trimAmount = Math.abs(
				num >= 1 || num == 0
					? 0
					: Math.min(0, Math.floor(Math.log10(Math.abs(num))))
			);

			// max sigFigs = 6, min = 1
			const sigFigs = Math.max(Math.min(6 - trimAmount, 6), 1);

			const tradePrecisionString = num.toPrecision(sigFigs);

			if (toLocaleString)
				return NumLib.formatNum
					.toTradePrecision(num)
					.toLocaleString(this.locale, {
						minimumSignificantDigits: sigFigs,
						maximumSignificantDigits: sigFigs,
					});

			return tradePrecisionString;
		},
		/**
		 * Formats a notional dollar value for UI. Goes to max. 2 decimals (accurate to 1 cent)
		 * @param num
		 * @returns
		 */
		toNotionalDisplay: (num: number) => {
			return `${num < 0 ? `-` : ``}$${(
				Math.round(Math.abs(num) * 100) / 100
			).toLocaleString(this.locale, {
				maximumFractionDigits: 2,
				minimumFractionDigits: 2,
			})}`;
		},
		/**
		 * Formats a notional dollar value. Goes to max. 2 decimals (accurate to 1 cent)
		 * @param num
		 * @returns
		 */
		toNotionalNum: (num: number) => {
			return parseFloat((Math.round(num * 100) / 100).toFixed(2));
		},
		/**
		 * This function prints the base amount of an asset with a number of decimals relative to the price of the asset, because for high priced assets we care about more accuracy in the base amount. Number of decimals corresponds to accuracy to ~ 1 cent
		 * @param baseAmount
		 * @param assetPrice in dollars
		 * @param skipLocaleFormatting Format using toFixed rather than localeString, which can't be parsed with regular number parsing
		 * @returns
		 */
		toBaseDisplay: (
			baseAmount: number,
			_assetPrice?: number,
			_skipLocaleFormatting = false,
			customSigFigs = 5
		): string => {
			if (baseAmount < 1) {
				if (baseAmount === 0) return '0.0000';

				if (baseAmount < 0.00001) {
					return '<0.00001';
				}

				return baseAmount.toFixed(4);
			}
			if (_skipLocaleFormatting) {
				return baseAmount.toFixed(
					Math.min(Math.max(0, Math.floor(Math.log10(_assetPrice + 1))) + 2, 6)
				);
			}

			return baseAmount.toLocaleString(this.locale, {
				minimumSignificantDigits: customSigFigs,
				maximumSignificantDigits: customSigFigs,
			});
		},
		/**
		 * This function prints the base amount of an asset with a number of decimals relative to the price of the asset, because for high priced assets we care about more accuracy in the base amount. Number of decimals corresponds to accuracy to ~ 1 cent
		 * @param baseAmount
		 * @param assetPrice in dollars
		 * @param skipLocaleFormatting Format using toFixed rather than localeString, which can't be parsed with regular number parsing
		 * @returns
		 */
		toBase: (baseAmount: number, assetPrice?: number): number => {
			if (
				assetPrice === 0 ||
				assetPrice === undefined ||
				Number(assetPrice) === undefined
			) {
				return parseFloat(baseAmount.toFixed(6));
			}

			const decimalDigits = Math.min(
				Math.max(0, Math.floor(Math.log10(assetPrice))) + 2,
				6
			);

			return parseFloat(baseAmount.toFixed(decimalDigits));
		},
		toBaseBN: (baseAmount: number) =>
			this.formatNum.toRawBn(baseAmount, AMM_RESERVE_PRECISION),
		toQuoteBN: (quoteAmount: number) =>
			this.formatNum.toRawBn(quoteAmount, QUOTE_PRECISION),
		/**
		 * Formats to price in locale style
		 * @param assetPrice
		 * @returns
		 */
		toDisplayPrice: (assetPrice: number): string => {
			if (assetPrice === undefined) return '';
			if (assetPrice === 0) return assetPrice.toFixed(2);

			return assetPrice.toLocaleString(this.locale, {
				maximumSignificantDigits: 6,
				minimumSignificantDigits: 6,
			});
		},
		/**
		 * Formats a price
		 * @param assetPrice
		 * @returns
		 */
		toPrice: (assetPrice: number): number => {
			if (assetPrice === undefined) return 0;
			if (assetPrice === 0) return parseFloat(assetPrice.toFixed(2));

			// const numFractionDigits = 6 - Math.floor(Math.log10(assetPrice));

			return parseFloat(assetPrice.toFixed(6));
		},
		/**
		 * Convert a number to a BN based on the required precision
		 * @param num
		 * @param precision
		 * @returns
		 */
		toRawBn: (num: number, precision: BN) => {
			let numericalAsBn: BN;

			try {
				numericalAsBn = new BN(num * precision.toNumber());
			} catch (e) {
				// Integer part
				if (Math.abs(num) < Number.MAX_SAFE_INTEGER) {
					numericalAsBn = new BN(num).mul(precision);

					// Decimal part
					//// BN Strips the decimal value when constructing one directly. Need to add it manually
					const mantissaSize = Math.log10(precision.toNumber());
					const decimalValue = parseFloat((num % 1).toFixed(mantissaSize));

					numericalAsBn.add(new BN(decimalValue * 10 ** mantissaSize));
				} else {
					numericalAsBn = new BN(Number.MAX_SAFE_INTEGER).mul(precision);
				}
			}

			return numericalAsBn;
		},
		/**
		 * Truncates a number to a certain number of decimal places. This differs from .toFixed() in that it rounds down, whereas .toFixed() rounds to the nearest number.
		 * @param num
		 * @param decimalPlaces
		 * @returns
		 */
		toDecimalPlaces: (
			num: number,
			decimalPlaces: number,
			noPadding?: boolean
		): string => {
			const truncatedNum =
				Math.floor(num * Math.pow(10, decimalPlaces)) /
				Math.pow(10, decimalPlaces);
			if (noPadding) {
				return truncatedNum.toString();
			}

			const paddedNum = truncatedNum.toString();
			const [integerPart, decimalPart = ''] = paddedNum.split('.');
			const paddedDecimal = decimalPart.padEnd(decimalPlaces, '0');
			return `${integerPart}.${paddedDecimal}`;
		},
	};

	static formatBn = {
		toRawNum: NumLib.toRawNum,
		fromQuote: (bn: BN) => {
			return NumLib.toRawNum(bn, QUOTE_PRECISION);
		},
		fromBase: (bn: BN) => {
			return NumLib.toRawNum(bn, AMM_RESERVE_PRECISION);
		},
	};

	/**
	 * Outputs information and formatted string for UI based on its log10 value
	 * @param value
	 * @returns
	 */
	static millify = (
		value: number
	): {
		mantissa: number;
		symbol: string;
		sigFigs: number;
		displayValue: number;
		displayString: string;
	} => {
		if (!value)
			return {
				mantissa: 0,
				symbol: '',
				sigFigs: 1,
				displayValue: 0,
				displayString: '0',
			};

		const valueLog10 = Math.log10(value === 0 ? 1 : value);

		const metricAmount = Math.floor(valueLog10 / 3);

		const sigFigs = Math.max(3 + (valueLog10 % 3), 1);

		let symbol = '';
		let mantissa = 1;

		switch (metricAmount) {
			case 1:
				mantissa = 10 ** 3;
				symbol = 'K';
				break;
			case 2:
				mantissa = 10 ** 6;
				symbol = 'M';
				break;
			case 3:
				mantissa = 10 ** 9;
				symbol = 'B';
				break;
			case 4:
				mantissa = 10 ** 12;
				symbol = 'T';
				break;
			case 0:
			default:
				mantissa = 1;
				symbol = '';
				break;
		}

		const displayValue = parseFloat(
			(value / mantissa).toLocaleString(this.locale, {
				maximumSignificantDigits: sigFigs,
			})
		);

		const displayString = `${(value / mantissa).toLocaleString(this.locale, {
			maximumSignificantDigits: sigFigs,
		})}${symbol}`;

		return {
			mantissa,
			symbol,
			sigFigs,
			displayValue,
			displayString,
		};
	};

	/**
	 * Get the precision to use for an asset so that base asset amounts are on the same scale as USD cents
	 * @param assetPrice
	 * @returns
	 */
	static getDisplayPrecision = (assetPrice: BigNum) => {
		if (assetPrice.eqZero() || !assetPrice) {
			return 6;
		}

		const exponent =
			assetPrice.toString().length - 1 - assetPrice.precision.toNumber();

		if (exponent < 1) return 2;

		return exponent + 2;
	};

	static bp = (num: number) => num * 10 ** -4;

	static isInvalid = (num: number) => !isFinite(num) || typeof num !== 'number';

	static sumBigNums = (nums: BigNum[], precision: BN) => {
		return nums.reduce((previousValue, currentValue) => {
			return previousValue.add(currentValue);
		}, BigNum.zero(precision));
	};

	static averageBigNums = (nums: BigNum[], precision: BN) => {
		if (!nums || !nums.length) return;
		const total = this.sumBigNums(nums, precision);
		return total.scale(1, nums.length);
	};
}
