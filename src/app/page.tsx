"use client";

import { useBookShelves } from "@/server/use/useBookShelves";
import { useUser } from "@/server/use/useUser";

const Reading = () => {
    const user = useUser();
    const bookShelves = useBookShelves(user.data);

    return (
        <main className="relative mb-20 flex h-fit w-full flex-col mouse:mb-0 mouse:mt-20">
            <h1 className="mx-auto my-20 text-4xl font-semibold tracking-wide">Reading</h1>
        </main>
    );
};

export default Reading;
