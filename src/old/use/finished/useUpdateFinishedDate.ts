import { updateFinished } from "@/server/action/finished";
import { getClientSide } from "@/server/use/useUser";
import { VolumesResult } from "@/type/Book";
import { Finished } from "@/type/Finished";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    id: number;
    bookId: string;
    timestamp: Date;
}

export const updateFinishedDate = async (props: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await updateFinished({ ...props, userId: user.id });
};

export const useUpdateFinishedDate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateFinishedDate,
        onMutate: async ({ bookId, id, timestamp }) => {
            await queryClient.cancelQueries({ queryKey: ["finishedDates", bookId] });
            const previousData: Finished[] | undefined = queryClient.getQueryData(["finishedDates", bookId]);

            if (previousData) {
                const newData = previousData
                    .map((finishedDate) => {
                        if (finishedDate.id === id) return { ...finishedDate, timestamp };
                        return finishedDate;
                    })
                    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                queryClient.setQueryData(["finishedDates", bookId], newData);
            }

            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
            const previousFinishedData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.FINISHED]);
            if (previousFinishedData) {
                const newItems = previousFinishedData.items.map((item) => {
                    if (item.id !== bookId) return item;
                    const finished = item.finished?.map((finishedDate) => {
                        if (finishedDate.id === id) return { ...finishedDate, timestamp };
                        return finishedDate;
                    });
                    return { ...item, finished };
                });
                queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], { ...previousFinishedData, items: newItems });
            }

            return { previousData, previousFinishedData };
        },
        onError: (err, { bookId }, context) => {
            context && queryClient.setQueryData(["finishedDates", bookId], context.previousData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], context.previousFinishedData);
        },
        onSettled: (data, err, { bookId }) => {
            queryClient.invalidateQueries({ queryKey: ["finishedDates", bookId], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
        },
    });
};
