import React, { PropsWithChildren, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

type TextProps = PropsWithChildren<{
	className?: string;
	onClick?: () => void;
	style?: React.CSSProperties;
}>;

export const Text = (props: TextProps) => {
	return (
		<span
			role="heading"
			onClick={props.onClick}
			className={props.className}
			style={props.style}
		>
			{props.children}
		</span>
	);
};

export const Header = (props: TextProps) => {
	return (
		<Text
			aria-role="heading"
			aria-level={1}
			{...props}
			className={twMerge(
				'text-[32px] sm:text-[50px] font-black leading-tight sm:leading-[60px] text-gradient-white-shadow',
				props.className
			)}
		/>
	);
};

Text.Header = Header;

export const XXL = (props: TextProps) => {
	return (
		<Text
			{...props}
			className={twMerge(
				'font-[300] text-[32px] leading-3 sm:leading-[44px]',
				props.className
			)}
		/>
	);
};
Text.XXL = XXL;

export const XL = (props: TextProps) => {
	const memoedClassName = useMemo(
		() =>
			twMerge(
				`font-[300] text-[20px] sm:text-[24px] leading-[36px]`,
				props.className
			),
		[props.className]
	);
	return (
		<Text
			aria-role="heading"
			aria-level={2}
			{...props}
			className={memoedClassName}
		/>
	);
};
Text.XL = XL;

export const H1 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() => twMerge(`font-[400] text-[20px] leading-[24px]`, props.className),
		[props.className]
	);

	return (
		<Text
			aria-role="heading"
			aria-level={1}
			{...props}
			className={memoedClassName}
		/>
	);
};

Text.H1 = H1;

export const H2 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() => twMerge(`font-medium text-[18px] leading-[22px]`, props.className),
		[props.className]
	);

	return (
		<Text
			aria-role="heading"
			aria-level={2}
			{...props}
			className={memoedClassName}
		/>
	);
};
Text.H2 = H2;

export const H3 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() => twMerge(`font-[400] text-[16px] leading-[20px]`, props.className),
		[props.className]
	);

	return (
		<Text
			aria-role="heading"
			aria-level={3}
			{...props}
			className={memoedClassName}
		/>
	);
};
Text.H3 = H3;

export const H4 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() => twMerge(`font-[300] text-[14px] leading-[18px]`, props.className),
		[props.className]
	);

	return (
		<Text
			aria-role="heading"
			aria-level={4}
			{...props}
			className={memoedClassName}
		/>
	);
};
Text.H4 = H4;

export const H5 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() => twMerge(`font-[400] text-[13px] leading-[18px]`, props.className),
		[props.className]
	);

	return (
		<Text
			aria-role="heading"
			aria-level={5}
			{...props}
			className={memoedClassName}
		/>
	);
};
Text.H5 = H5;

export const H6 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() => twMerge(`font-[400] text-[13px] leading-[18px]`, props.className),
		[props.className]
	);

	return (
		<Text
			aria-role="heading"
			aria-level={6}
			{...props}
			className={memoedClassName}
		/>
	);
};
Text.H6 = H6;

export const BODY1 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() => twMerge(`font-[300] text-[14px] leading-[16px]`, props.className),
		[props.className]
	);

	return <Text {...props} className={memoedClassName} />;
};
Text.BODY1 = BODY1;

export const BODY2 = (props: TextProps & { light?: boolean }) => {
	const memoedClassName = useMemo(
		() => twMerge(`text-[13px] leading-[16px]`, props.className),
		[props.className]
	);

	return <Text {...props} className={memoedClassName} />;
};
Text.BODY2 = BODY2;

export const BODY3 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() =>
			twMerge(
				`font-[300] text-[12px] leading-[14px] tracking-[0.15px]`,
				props.className
			),
		[props.className]
	);

	return <Text {...props} className={memoedClassName} />;
};
Text.BODY3 = BODY3;

export const P1 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() => twMerge(`font-[300] text-[13px] leading-[18px]`, props.className),
		[props.className]
	);

	return <Text {...props} className={memoedClassName} />;
};
Text.P1 = P1;

export const MICRO1 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() =>
			twMerge(
				`font-[400] text-[11px] leading-[12px] tracking-[.15px]`,
				props.className
			),
		[props.className]
	);

	return <Text {...props} className={memoedClassName} />;
};
Text.MICRO1 = MICRO1;

export const MICRO2 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() =>
			twMerge(
				`font-[400] text-[8px] leading-[10px] tracking-[.15px]`,
				props.className
			),
		[props.className]
	);

	return <Text {...props} className={memoedClassName} />;
};
Text.MICRO2 = MICRO2;

export const MICRO3 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() => twMerge(`font-[400] text-[10px] leading-[12px]`, props.className),
		[props.className]
	);

	return <Text {...props} className={memoedClassName} />;
};
Text.MICRO3 = MICRO3;

export const MICRO4 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() => twMerge(`font-[400] text-[10px] leading-[11px]`, props.className),
		[props.className]
	);

	return <Text {...props} className={memoedClassName} />;
};
Text.MICRO4 = MICRO4;

export const INPUTLABEL01 = (props: TextProps) => {
	const memoedClassName = useMemo(
		() => twMerge(`font-[400] text-[12px] leading-[16px]`, props.className),
		[props.className]
	);

	return <Text {...props} className={memoedClassName} />;
};
Text.INPUTLABEL01 = INPUTLABEL01;

export default Text;
