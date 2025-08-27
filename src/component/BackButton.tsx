import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

interface Props {
    className?: string;
}

const BackButton = ({ className }: Props) => {
    const router = useRouter();
    const onBack = () => router.history.back();

    return (
        <Button onClick={onBack} size="icon" variant="glass" className={cn("z-40", className)}>
            <ArrowLeft className="icon" />
        </Button>
    );
};

export default BackButton;
