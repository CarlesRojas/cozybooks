"use client";

import { Button } from "@/component/ui/button";
import { cn } from "@/util";
import { useRouter } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";

interface Props {
    className?: string;
}

const BackButton = ({ className }: Props) => {
    const { back } = useRouter();

    return (
        <Button onClick={back} size="icon" variant="glass" className={cn("z-40", className)}>
            <LuArrowLeft className="icon" />
        </Button>
    );
};

export default BackButton;
