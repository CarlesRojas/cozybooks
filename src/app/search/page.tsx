import { Input } from "@/component/ui/input";
import { cn } from "@/util";
import { isIOS } from "react-device-detect";
import { LuSearch } from "react-icons/lu";

const Search = async () => {
    return (
        <main className={cn("relative mb-20 flex h-fit w-full flex-col gap-8 p-6", isIOS && "mb-24")}>
            <section className="flex h-fit w-full flex-col">
                <Input
                    placeholder="Search"
                    type="text"
                    icon={
                        <LuSearch className="icon stroke-2 text-neutral-500 transition-colors group-focus-within:text-neutral-950 group-focus-within:dark:text-neutral-50" />
                    }
                />
            </section>

            <section className="flex h-fit min-h-[30vh] w-full flex-col">
                <h2 className="sticky top-6 text-3xl font-bold opacity-90">Results</h2>
            </section>

            <section className="flex h-fit min-h-[30vh] w-full flex-col">
                <h2 className="sticky top-6 text-3xl font-bold opacity-90">Recommended for you</h2>
            </section>
        </main>
    );
};

export default Search;
