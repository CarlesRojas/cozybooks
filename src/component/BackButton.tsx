import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { useRouter } from "@tanstack/react-router";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
    className?: string;
}

const BackButton = ({ className }: Props) => {
    const router = useRouter();
    const onBack = () => router.history.back();

    return (
        <Button onClick={onBack} size="icon" variant="glass" className={cn("z-40", className)}>
            <FontAwesomeIcon icon={faArrowLeft} className="icon" />
        </Button>
    );
};

export default BackButton;
