import SignInButton from "@/component/SignInButton";
import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { Link } from "@tanstack/react-router";
import { isIOS } from "react-device-detect";

interface Props {
    isError?: boolean;
}

const Welcome = ({ isError }: Props) => {
    return (
        // Clipped: the wash below is wider than a phone, and an absolutely positioned
        // element still counts towards scrollable overflow, so it would otherwise push
        // the page sideways.
        <main
            suppressHydrationWarning
            className={cn(
                "relative flex min-h-dvh w-full flex-col items-center justify-center gap-4 overflow-hidden px-4 py-12",
                isIOS && "pb-16",
            )}
        >
            {/* The card sits on a wash of the app's accent rather than on flat
                background — enough to give it somewhere to sit without competing with
                it. Painted before the card in the markup, so nothing needs a stacking
                context to keep it behind. */}
            <div
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 size-[32rem] max-w-[130vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/15 blur-[100px] dark:bg-purple-500/20"
            />

            <section className="bg-neutral-150 dark:bg-neutral-850 relative flex w-full max-w-md flex-col items-center gap-6 rounded-[22px] border border-neutral-500/25 px-6 py-10 shadow-xl shadow-neutral-950/5 sm:px-10 dark:border-neutral-500/40 dark:shadow-neutral-950/40">
                {/* Decorative: the heading right below already names the app. */}
                <img src="/logo512.png" alt="" width={256} height={256} className="size-24 rounded-3xl shadow-lg shadow-neutral-950/10" />

                <div className="flex flex-col items-center gap-3">
                    <h1 className="text-center text-3xl leading-tight font-bold tracking-wide text-balance">Welcome to CozyBooks</h1>

                    <p className="text-center leading-snug font-medium tracking-wide text-pretty opacity-70">
                        The best way to keep track of all the books you have and enjoy all the ones you want to read.
                    </p>
                </div>

                <div className="flex w-full flex-col items-center gap-3">
                    <SignInButton className="w-full" />

                    {isError && (
                        <p className="text-center text-sm font-semibold tracking-wide text-pretty text-red-500">
                            There was an error while signing in. Please try again.
                        </p>
                    )}

                    <p className="text-center text-xs leading-relaxed font-semibold tracking-wide text-pretty opacity-40">
                        Sign in with your Google account to get started. We will only use your data (email, name, and book library) to
                        provide you with the best experience. We do not sell or share your data with anyone.
                    </p>
                </div>
            </section>

            <Button className="relative text-base opacity-60" variant="link" asChild>
                <Link to={"/legal/privacy-policy"}>Privacy Policy</Link>
            </Button>
        </main>
    );
};

export default Welcome;
