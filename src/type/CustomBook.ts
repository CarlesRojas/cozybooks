// What a user fills in when they write a book of their own. It is deliberately the
// subset of `Book` the book page renders, because that page is the only thing these
// fields exist to feed.

export interface CustomBookInput {
    title: string;
    authors?: Array<string>;
    description?: string;
    pageCount?: number;
    // Tags. They land in `categories`, which is the field the book page already
    // renders its tags from.
    categories?: Array<string>;

    // The cover, resolved by the form before it saves: a file to upload, or a URL
    // that is already in the Blob store (the current cover, kept), or nothing at all
    // (no cover, or the current one removed).
    coverFile?: File | null;
    coverUrl?: string;
}
