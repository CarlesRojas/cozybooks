"use client";

import { Button } from "@/component/ui/button";
import { useBookShelves } from "@/server/use/useBookShelves";
import { Route } from "@/type/Route";
import { cn } from "@/util";
import Link from "next/link";
import { isIOS } from "react-device-detect";

const Reading = () => {
    const bookShelves = useBookShelves();
    console.log(bookShelves.data);

    return (
        <main
            suppressHydrationWarning
            className={cn(
                "relative mx-auto mb-20 flex h-fit min-h-[calc(100vh_-_5rem)] w-full max-w-screen-lg flex-col gap-8 p-6",
                isIOS && "mb-24",
            )}
        >
            <div className="flex h-fit w-full grow flex-col gap-8">
                <section className="flex h-fit min-h-[30vh] w-full flex-col">
                    <h2 className="h2 sticky top-6">Reading</h2>
                </section>

                <section className="flex h-fit min-h-[30vh] w-full flex-col">
                    <h2 className="h2 sticky top-6">For Later</h2>
                </section>
            </div>

            <div className="sticky bottom-20 flex w-full flex-wrap justify-center gap-x-4">
                <Button className="text-sm opacity-40" variant="link" asChild>
                    <Link href={Route.PRIVACY_POLICY}>Privacy Policy</Link>
                </Button>
            </div>
        </main>
    );
};

export default Reading;
