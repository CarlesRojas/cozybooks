"use client";

import { Button } from "@/component/ui/button";
import { useRouter } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";

const BackButton = () => {
    const { back } = useRouter();

    return (
        <Button onClick={back} className="sticky top-4 z-20 mouse:top-20">
            <LuArrowLeft className="mr-3 h-4 w-4 stroke-[3]" />
        </Button>
    );
};

export default BackButton;
