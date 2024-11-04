import { PropsWithChildren } from 'react';
import { HeaderCellWrapper } from './HeaderCellWrapper';

export const HeaderCell = ({
    children,
    className,
    alignRight,
}: PropsWithChildren<{
    className?: string;
    alignRight?: boolean;
}>) => {
    return (
        <HeaderCellWrapper className={className} alignRight={alignRight}>
            {children}
        </HeaderCellWrapper>
    );
};