import { LuLoader2 } from "react-icons/lu";

const Loading = () => {
    return (
        <main className="relative flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center">
            <LuLoader2 className="size-8 animate-spin" />
        </main>
    );
};

export default Loading;
