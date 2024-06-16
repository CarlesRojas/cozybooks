import { cn } from "@/util";
import { isIOS } from "react-device-detect";

const Finished = async () => {
    return (
        <main className={cn("relative mx-auto mb-20 flex h-fit w-full max-w-screen-lg flex-col gap-8 p-6", isIOS && "mb-24")}>
            <section className="flex h-fit min-h-[30vh] w-full flex-col">
                <h2 className="h2 sticky top-6">Stats</h2>
            </section>

            <section className="flex h-fit min-h-[30vh] w-full flex-col">
                <h2 className="h2 sticky top-6">2024</h2>
            </section>
        </main>
    );
};

export default Finished;
