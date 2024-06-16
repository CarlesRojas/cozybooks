"use client";

import { useBookShelves } from "@/server/use/useBookShelves";
import { useUser } from "@/server/use/useUser";
import { cn } from "@/util";
import { isIOS } from "react-device-detect";

const Reading = () => {
    const user = useUser();
    const bookShelves = useBookShelves(user.data);
    console.log(bookShelves.data);

    return (
        <main className={cn("relative mb-20 flex h-fit w-full flex-col gap-8 p-6", isIOS && "mb-24")}>
            <section className="flex h-fit min-h-[30vh] w-full flex-col">
                <h2 className="sticky top-6 text-3xl font-bold opacity-90">Reading</h2>
            </section>

            <section className="flex h-fit min-h-[30vh] w-full flex-col">
                <h2 className="sticky top-6 text-3xl font-bold opacity-90">For Later</h2>
            </section>
        </main>
    );
};

export default Reading;
