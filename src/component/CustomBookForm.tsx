import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/component/ui/popover";
import { useDeleteCustomBook } from "@/convex/use/customBook/useDeleteCustomBook";
import { useSaveCustomBook } from "@/convex/use/customBook/useSaveCustomBook";
import { ALLOWED_COVER_TYPES, MAX_COVER_BYTES } from "@/lib/blob";
import { cn } from "@/lib/cn";
import type { Book } from "@/type/Book";
import { useNavigate } from "@tanstack/react-router";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faBook, faImage, faPlus, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface Props {
    userId: string;
    // Editing when present, creating when not. The two differ by so little — a
    // starting value and a delete button — that one form covers both.
    book?: Book;
}

// Authors and tags are both "a short list of words the user keeps adding to", so
// they are the same control twice: type, press Enter, get a chip. Comma works too,
// because a list of names is the one place people reach for it by reflex.
const ChipInput = ({
    values,
    placeholder,
    icon,
    onChange,
}: {
    values: Array<string>;
    placeholder: string;
    icon: IconDefinition;
    onChange: (values: Array<string>) => void;
}) => {
    const [draft, setDraft] = useState("");

    const commit = (value: string) => {
        const cleaned = value.trim();
        if (!cleaned || values.includes(cleaned)) return setDraft("");

        onChange([...values, cleaned]);
        setDraft("");
    };

    return (
        <div className="flex w-full flex-col gap-3">
            <Input
                type="text"
                autoComplete="off"
                value={draft}
                placeholder={placeholder}
                onChange={(event) => {
                    const value = event.target.value;
                    if (value.endsWith(",")) commit(value.slice(0, -1));
                    else setDraft(value);
                }}
                onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    // The form would submit otherwise, saving the book on what was
                    // meant to be "finish this chip".
                    event.preventDefault();
                    commit(draft);
                }}
                onClear={draft.length > 0 ? () => setDraft("") : undefined}
                icon={
                    <FontAwesomeIcon
                        icon={icon}
                        className="icon stroke-2 text-neutral-500 transition-colors group-focus-within:text-neutral-950 group-focus-within:dark:text-neutral-50"
                    />
                }
            />

            {values.length > 0 && (
                <div className="flex w-full flex-wrap gap-2">
                    {values.map((value) => (
                        <Button
                            key={value}
                            type="button"
                            variant="input"
                            size="small"
                            onClick={() => onChange(values.filter((other) => other !== value))}
                        >
                            <p className="text-sm font-semibold tracking-wide">{value}</p>
                            <FontAwesomeIcon icon={faXmark} className="ml-3 h-3 w-3" />
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
};

// A div rather than a label: every control below already ships its own label
// element, and nesting one inside another is invalid and makes the outer one steal
// the click.
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex w-full flex-col gap-2">
        <p className="px-1 text-sm font-semibold tracking-wide opacity-60">{label}</p>
        {children}
    </div>
);

const CustomBookForm = ({ userId, book }: Props) => {
    const navigate = useNavigate();

    const saveCustomBook = useSaveCustomBook();
    const deleteCustomBook = useDeleteCustomBook();

    const [title, setTitle] = useState(book?.title ?? "");
    const [authors, setAuthors] = useState<Array<string>>(book?.authors ?? []);
    const [tags, setTags] = useState<Array<string>>(book?.categories ?? []);
    const [pageCount, setPageCount] = useState(book?.pageCount ? String(book.pageCount) : "");
    const [description, setDescription] = useState(book?.description ?? "");

    // `url` is what the preview shows and `file` is what still has to be uploaded.
    // While a newly picked file is pending, `url` is a local object URL — which is
    // why the save reads `file` first and only falls back to `url`.
    const [cover, setCover] = useState<{ url: string | null; file: File | null }>({
        url: book?.large ?? book?.thumbnail ?? null,
        file: null,
    });
    const [coverError, setCoverError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Object URLs are held by the document until revoked, and a user trying covers
    // one after another makes one per attempt.
    const objectUrlRef = useRef<string | null>(null);
    useEffect(() => {
        return () => {
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        };
    }, []);

    const pickCover = (file: File | undefined) => {
        if (!file) return;

        // Checked here as well as on the server: the server's rejection arrives after
        // the file has been read and sent, which on a phone is a slow way to find out
        // the picture was too big.
        if (!ALLOWED_COVER_TYPES.includes(file.type)) return setCoverError("That file isn't an image the store accepts");
        if (file.size > MAX_COVER_BYTES) return setCoverError(`Covers have to be under ${Math.round(MAX_COVER_BYTES / (1024 * 1024))} MB`);

        setCoverError(null);
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = URL.createObjectURL(file);
        setCover({ url: objectUrlRef.current, file });
    };

    const clearCover = () => {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
        setCoverError(null);
        setCover({ url: null, file: null });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const isSaveable = title.trim().length > 0 && !saveCustomBook.isPending && !deleteCustomBook.isPending;

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isSaveable) return;

        const parsedPageCount = Number.parseInt(pageCount, 10);

        const bookId = await saveCustomBook.save({
            userId,
            bookId: book?.id,
            title: title.trim(),
            authors: authors.length > 0 ? authors : undefined,
            categories: tags.length > 0 ? tags : undefined,
            description: description.trim() || undefined,
            pageCount: Number.isFinite(parsedPageCount) && parsedPageCount > 0 ? parsedPageCount : undefined,
            coverFile: cover.file,
            coverUrl: cover.file ? undefined : (cover.url ?? undefined),
        });

        if (bookId) navigate({ to: "/book/$bookId", params: { bookId } });
    };

    const onDelete = async () => {
        if (!book) return;

        const deleted = await deleteCustomBook.mutate({ bookId: book.id, userId });
        if (deleted) navigate({ to: "/custom" });
    };

    return (
        <form className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 px-6" onSubmit={onSubmit}>
            <div className="flex w-full flex-col items-center gap-4">
                <div className="aspect-book relative w-40">
                    {cover.url ? (
                        <img
                            src={cover.url}
                            alt="Book cover"
                            className="absolute inset-0 h-full w-full rounded-[22px] border border-neutral-500/25 object-cover object-center dark:border-neutral-500/40"
                        />
                    ) : (
                        <div className="bg-neutral-150 dark:bg-neutral-850 absolute inset-0 flex h-full w-full items-center justify-center rounded-[22px] border border-neutral-500/25 dark:border-neutral-500/40">
                            <FontAwesomeIcon icon={faBook} className="size-8 min-h-8 min-w-8 opacity-40" />
                        </div>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_COVER_TYPES.join(",")}
                    className="hidden"
                    onChange={(event) => pickCover(event.target.files?.[0])}
                />

                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button type="button" variant="glass" onClick={() => fileInputRef.current?.click()}>
                        <FontAwesomeIcon icon={faImage} className="icon mr-3" />
                        <p>{cover.url ? "Change cover" : "Add cover"}</p>
                    </Button>

                    {cover.url && (
                        <Button type="button" variant="ghost" onClick={clearCover}>
                            <FontAwesomeIcon icon={faXmark} className="icon mr-3" />
                            <p>Remove</p>
                        </Button>
                    )}
                </div>

                {coverError && <p className="text-center text-sm font-semibold tracking-wide text-red-500">{coverError}</p>}
            </div>

            <div className="flex w-full flex-col gap-6">
                <Field label="Name">
                    <Input
                        type="text"
                        autoComplete="off"
                        value={title}
                        placeholder="Book name"
                        onChange={(event) => setTitle(event.target.value)}
                        onClear={title.length > 0 ? () => setTitle("") : undefined}
                        icon={
                            <FontAwesomeIcon
                                icon={faBook}
                                className="icon stroke-2 text-neutral-500 transition-colors group-focus-within:text-neutral-950 group-focus-within:dark:text-neutral-50"
                            />
                        }
                    />
                </Field>

                <Field label="Authors">
                    <ChipInput values={authors} placeholder="Add an author" icon={faPlus} onChange={setAuthors} />
                </Field>

                <Field label="Pages">
                    <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        autoComplete="off"
                        value={pageCount}
                        placeholder="Number of pages"
                        onChange={(event) => setPageCount(event.target.value)}
                        onClear={pageCount.length > 0 ? () => setPageCount("") : undefined}
                    />
                </Field>

                <Field label="Tags">
                    <ChipInput values={tags} placeholder="Add a tag" icon={faPlus} onChange={setTags} />
                </Field>

                <Field label="Description">
                    <textarea
                        value={description}
                        placeholder="What is this book about?"
                        rows={6}
                        onChange={(event) => setDescription(event.target.value)}
                        className="bg-neutral-150 dark:bg-neutral-850 w-full resize-y rounded-[18px] border border-neutral-500/25 px-4 py-3 text-[16px] font-medium !outline-none placeholder:text-neutral-500 sm:max-w-[30rem] dark:border-neutral-500/40"
                    />
                </Field>
            </div>

            {saveCustomBook.error && (
                <p className="max-w-[30rem] text-center text-sm font-semibold tracking-wide text-pretty text-red-500">
                    {saveCustomBook.error}
                </p>
            )}

            {deleteCustomBook.isError && (
                <p className="text-center text-sm font-semibold tracking-wide text-red-500">The book could not be deleted.</p>
            )}

            <div className={cn("flex w-full flex-wrap items-center justify-center gap-3", book && "justify-between")}>
                <Button type="submit" disabled={!isSaveable}>
                    <FontAwesomeIcon icon={faBook} className="icon mr-3" />
                    <p>{saveCustomBook.isPending ? "Saving…" : book ? "Save changes" : "Create book"}</p>
                </Button>

                {book && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="ghost" disabled={deleteCustomBook.isPending}>
                                <FontAwesomeIcon icon={faTrash} className="icon mr-3" />
                                <p>Delete</p>
                            </Button>
                        </PopoverTrigger>

                        {/* Deleting takes the shelves, the rating and the finished
                            dates with it, so it asks first. */}
                        <PopoverContent className="flex w-80 flex-col gap-4">
                            <p className="text-sm leading-snug font-medium tracking-wide text-pretty opacity-80">
                                This deletes the book and everything you tracked about it. It can't be undone.
                            </p>

                            <Button type="button" variant="destructive" onClick={() => void onDelete()}>
                                <FontAwesomeIcon icon={faTrash} className="icon mr-3" />
                                <p>Delete book</p>
                            </Button>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
        </form>
    );
};

export default CustomBookForm;
