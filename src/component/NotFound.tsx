import BackButton from "@/component/BackButton";
import { ReactNode } from "react";
import { LuBook } from "react-icons/lu";

export enum NotFoundType {
    BOOK = "BOOK",
}

interface Props {
    type: NotFoundType;
}

const NotFound = ({ type }: Props) => {
    const icon: Record<NotFoundType, ReactNode> = {
        [NotFoundType.BOOK]: <LuBook className="size-12" />,
    };

    const message: Record<NotFoundType, string> = {
        [NotFoundType.BOOK]: "Book not found",
    };

    return (
        <div className="relative h-screen w-full justify-center">
            <div className="relative m-auto mb-32 flex h-full w-full max-w-screen-lg flex-col items-center justify-center gap-2 p-3">
                {icon[type]}
                <p className="mb-4 text-lg font-medium tracking-wide">{message[type]}</p>

                <BackButton />
            </div>
        </div>
    );
};

export default NotFound;
