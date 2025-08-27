import { Button } from "@/component/ui/button";
import { Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";

export function NotFound() {
    const goBack = (event: MouseEvent) => {
        event.preventDefault();
        window.history.back();
    };

    return (
        <div className="space-y-2 p-2">
            <div>
                <p>The page you are looking for does not exist.</p>
            </div>

            <p className="flex flex-wrap items-center gap-2">
                <Button onClick={goBack} variant="ghost">
                    Go back
                </Button>

                <Button asChild>
                    <Link to={"/" as any}>Go home</Link>
                </Button>
            </p>
        </div>
    );
}
