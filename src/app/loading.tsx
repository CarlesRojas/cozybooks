import { LuLoader } from "react-icons/lu";

const Loading = () => {
    return (
        <main className="relative flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center">
            <LuLoader className="size-8 min-h-8 min-w-8 animate-spin stroke-[3] opacity-50 duration-2000" />
        </main>
    );
};

export default Loading;
