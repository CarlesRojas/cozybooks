"use client";

import { Button } from "@/component/ui/button";
import { useRouter } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";

const BackButton = () => {
    const { back } = useRouter();

    return (
        <Button onClick={back} size="icon" variant="glass">
            <LuArrowLeft className="icon" />
        </Button>
    );
};

export default BackButton;
