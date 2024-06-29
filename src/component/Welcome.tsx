import SignInButton from "@/component/SignInButton";
import { Button } from "@/component/ui/button";
import { Route } from "@/type/Route";
import { cn } from "@/util";
import Image from "next/image";
import Link from "next/link";
import { isIOS } from "react-device-detect";

interface Props {
    isError?: boolean;
}

const Welcome = async ({ isError }: Props) => {
    return (
        <main suppressHydrationWarning className={cn("relative flex h-dvh w-full flex-col items-center px-4 py-16", isIOS && "mb-4")}>
            <div className="jstifyu-center relative flex h-[90dvh] w-full flex-col items-center">
                <section className="relative flex w-full grow flex-col items-center justify-center gap-3">
                    <Image src="/logo512.png" alt="CozyBooks" width={256} height={256} className="-m-4 size-44 rounded-3xl" />

                    <h1 className="mx-auto max-w-64 text-pretty text-center text-4xl font-bold leading-tight tracking-wide">
                        Welcome to CozyBooks
                    </h1>

                    <p className="max-w-[30rem] text-pretty text-center text-lg font-medium leading-snug tracking-wide">
                        The best way to keep track of all the books you have and enjoy all the ones you want to read.
                    </p>
                </section>

                <section className="relative flex h-fit w-full flex-col items-center justify-center gap-4 py-8 text-center">
                    <SignInButton />

                    {isError && (
                        <p className="max-w-[30rem] text-pretty text-sm font-semibold tracking-wide text-red-500">
                            There was an error while signing in. Please try again.
                        </p>
                    )}

                    <p className="max-w-[30rem] text-pretty text-sm font-semibold tracking-wide opacity-40">
                        Sign in with your Google account to get started. We will only use your data (email, name, and book library) to
                        provide you with the best experience. We do not sell or share your data with anyone.
                    </p>
                </section>

                <div className="mt-16 flex w-full flex-wrap justify-center gap-x-4">
                    <Button className="text-base opacity-60" variant="link" asChild>
                        <Link href={Route.PRIVACY_POLICY}>Privacy Policy</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
};

export default Welcome;
