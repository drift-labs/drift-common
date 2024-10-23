import { TextProps } from './Text';
import { DetailedHTMLProps, HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

/*
 * Typo follows the Typography 2.0 design system in Figma. (https://www.figma.com/design/MkmSp70bPBv8OB51kT3z4k/%F0%9F%92%A1Drift-v2.1-Design-System-(WIP)?node-id=36611-35229)
 * Even though the Text components themselves are just classes applied, it makes for easier readability over using the classes in the parent component.
 *
 * We also follow a mobile-first approach for responsive text. E.g. if a text component is Title 2 on mobile and Heading 5 on desktop, we should define the component as such:
 * <Typo.T2 className="md:typo-h5">Text</Typo.T2>
 *
 * The classes 'typo-xx' are found in typography.css. These classes are not extended in tailwind.config.js.
 *
 * Why wasn't the classes extended in tailwind.config.js? e.g. why use CSS class 'typo-h1' over extended Tailwind config 'text-h1'?
 * There is an unintended effect where the 'text' prefixed classes clashes when using tailwind-merge. This causes `twMerge` to use the last class in the array.
 * e.g. className="text-h1 text-text-label" -> even though 'text-h1' and 'text-text-label' are 2 different classes that apply completely different CSS, twMerge will only use 'text-text-label'.
 *
 */

export const Typo = (
	props: DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
) => {
	return (
		<span
			onClick={props.onClick}
			className={props.className}
			style={props.style}
		>
			{props.children}
		</span>
	);
};

// Heading components
const H1 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-h1', props.className)} />;
};
Typo.H1 = H1;

const H2 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-h2', props.className)} />;
};
Typo.H2 = H2;

const H3 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-h3', props.className)} />;
};
Typo.H3 = H3;

const H4 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-h4', props.className)} />;
};
Typo.H4 = H4;

const H5 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-h5', props.className)} />;
};
Typo.H5 = H5;

const H6 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-h6', props.className)} />;
};
Typo.H6 = H6;

// Title components
const T1 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-t1', props.className)} />;
};
Typo.T1 = T1;

const T2 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-t2', props.className)} />;
};
Typo.T2 = T2;

const T3 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-t3', props.className)} />;
};
Typo.T3 = T3;

const T4 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-t4', props.className)} />;
};
Typo.T4 = T4;

const T5 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-t5', props.className)} />;
};
Typo.T5 = T5;

// Body components
const B1 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-b1', props.className)} />;
};
Typo.B1 = B1;

const B2 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-b2', props.className)} />;
};
Typo.B2 = B2;

const B3 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-b3', props.className)} />;
};
Typo.B3 = B3;

const B4 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-b4', props.className)} />;
};
Typo.B4 = B4;

const B5 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-b5', props.className)} />;
};
Typo.B5 = B5;

const B6 = (props: TextProps) => {
	return <Typo {...props} className={twMerge('typo-b6', props.className)} />;
};
Typo.B6 = B6;
