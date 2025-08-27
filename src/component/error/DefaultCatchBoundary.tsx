import { Button } from "@/component/ui/button";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { ErrorComponent, Link, rootRouteId, useMatch, useRouter } from "@tanstack/react-router";
import type { MouseEvent } from "react";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
    const router = useRouter();
    const isRoot = useMatch({ strict: false, select: (state) => state.id === rootRouteId });

    console.error(error);

    const goBack = (event: MouseEvent) => {
        event.preventDefault();
        window.history.back();
    };

    const tryAgain = () => {
        router.invalidate();
    };

    return (
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 p-4">
            <ErrorComponent error={error} />
            <div className="flex flex-wrap items-center gap-2">
                <Button onClick={tryAgain} variant="ghost">
                    Try again
                </Button>

                <Button asChild>
                    <Link to={"/" as any} onClick={isRoot ? undefined : goBack}>
                        {isRoot ? "Go home" : "Go back"}
                    </Link>
                </Button>
            </div>
        </div>
    );
}
