import React, { CSSProperties, PropsWithChildren } from 'react';

type GradientBgTxtProps = PropsWithChildren<{
	className?: string;
}> &
	React.ComponentProps<'div'>;

export const GradientBgTxt = ({
	children,
	className = '',
	...props
}: GradientBgTxtProps) => {
	return (
		<div
			{...props}
			className={`bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent inline-block ${className}`}
		>
			{children}
		</div>
	);
};

type HoverGradientParentProps = PropsWithChildren<{
	className?: string;
}>;

export const HoverGradientParent = ({
	children,
	className = '',
}: HoverGradientParentProps) => {
	return (
		<div
			className={`[&>*:nth-child(1)]:inline-block [&>*:nth-child(2)]:hidden hover:[&>*:nth-child(1)]:opacity-50 hover:[&>*:nth-child(2)]:inline-block ${className}`}
		>
			{children}
		</div>
	);
};

export const GradientText = (
	props: PropsWithChildren<{
		className?: string;
		style?: CSSProperties;
		onHover?: boolean;
		disabled?: boolean;
	}>
) => {
	if (props.disabled) {
		return <>{props.children}</>;
	}

	if (props.onHover) {
		return (
			<HoverGradientParent>
				<span className={props.className} style={props.style}>
					<div>{props.children}</div>
				</span>
				<span className={props.className} style={props.style}>
					<GradientBgTxt>{props.children}</GradientBgTxt>
				</span>
			</HoverGradientParent>
		);
	}

	return (
		<GradientBgTxt className={props.className} style={props.style}>
			{props.children}
		</GradientBgTxt>
	);
};
export default GradientText;
