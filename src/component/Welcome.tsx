import SignInButton from "@/component/SignInButton";
import Image from "next/image";

interface Props {
    isError?: boolean;
}

const Welcome = async ({ isError }: Props) => {
    return (
        <main className="relative flex h-screen w-full flex-col items-center p-4">
            <section className="relative flex w-full grow flex-col items-center justify-center gap-3">
                <Image src="/icon.png" alt="CozyBooks" width={256} height={256} className="mb-8 size-28 rounded-3xl" />

                <h1 className="mx-auto max-w-64 text-pretty text-center text-4xl font-bold leading-tight tracking-wide">
                    Welcome to CozyBooks
                </h1>

                <p className="max-w-[30rem] text-pretty text-center text-lg font-medium leading-snug tracking-wide">
                    The best way to keep track of all the books you have and enjoy all the ones you want to read.
                </p>
            </section>

            <section className="relative flex h-fit w-full flex-col items-center justify-center gap-4 py-8 text-center">
                <p className="max-w-[30rem] text-pretty text-sm font-semibold tracking-wide opacity-40">
                    CozyBooks builds on top of Google Books. Sign in with your Google account to get started.
                </p>

                <SignInButton />

                {isError && (
                    <p className="max-w-[30rem] text-pretty text-sm font-semibold tracking-wide text-red-500">
                        There was an error while signing in. Please try again.
                    </p>
                )}
            </section>
        </main>
    );
};

export default Welcome;
