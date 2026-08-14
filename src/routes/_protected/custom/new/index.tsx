import BackButton from "@/component/BackButton";
import CustomBookForm from "@/component/CustomBookForm";
import { cn } from "@/lib/cn";
import { createFileRoute } from "@tanstack/react-router";
import { isIOS } from "react-device-detect";

export const Route = createFileRoute("/_protected/custom/new/")({ component: RouteComponent });

function RouteComponent() {
    const context = Route.useRouteContext();

    return (
        <main suppressHydrationWarning className={cn("relative mb-24 flex h-fit w-full flex-col gap-6 py-6 lg:pt-25", isIOS && "mb-28")}>
            <BackButton className="sticky top-6 mx-6 lg:hidden" />

            <h1 className="px-6 text-center text-2xl leading-tight font-bold tracking-wide">New book</h1>

            <CustomBookForm userId={context.user!.id} />
        </main>
    );
}
