import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
    className?: string;
}

const BackButton = ({ className }: Props) => {
    const { back } = useRouter();

    return (
        <Button onClick={back} size="icon" variant="glass" className={cn("z-40", className)}>
            <ArrowLeft className="icon" />
        </Button>
    );
};

export default BackButton;
