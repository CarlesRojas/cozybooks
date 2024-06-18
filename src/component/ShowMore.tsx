"use client";

import { Button } from "@/component/ui/button";
import { ReactNode, useCallback, useState } from "react";
import { ReadMore } from "react-shorten";

export interface Props {
    truncate: number | undefined;
    children: ReactNode;
    className?: string;
    expandText?: string;
    collapseText?: string;
}

export const ShowMore = ({ truncate, children, expandText, collapseText, className }: Props) => {
    const [expanded, setExpanded] = useState(false);

    const onShowMore = useCallback(() => setExpanded(true), []);
    const onShowLess = useCallback(() => setExpanded(false), []);

    return (
        <ReadMore
            truncate={truncate}
            expanded={expanded}
            showMore={
                <>
                    <Button variant="ghost" size="ghost" onClick={onShowMore}>
                        {expandText ?? "Show more"}
                    </Button>
                </>
            }
            showLess={
                <Button variant="ghost" size="ghost" onClick={onShowLess}>
                    {collapseText ?? "Show less"}
                </Button>
            }
        >
            <span className={className}>{children}</span>
        </ReadMore>
    );
};

export default ShowMore;
