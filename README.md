## CozyBooks Web App

### Run locally

-   Install the dependencies with:
    ```bash
    bun i
    ```
-   Run the project locally with:
    ```bash
    bun dev
    ```
-   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Test on mobile devices

With the project running locally, you can use [ngrok](https://ngrok.com/download) to expose your local server to the internet. This way you can test the website on mobile devices:

-   Open a local server with `ngrok http 3000`
    ```bash
    ngrok http 3000
    ```
-   Copy the URL that ngrok gives you and paste it in the browser of your mobile device

## Database

-   Generate migrations:

    ```bash
    bun db:generate
    ```

-   Migrate:
    ```bash
    bun db:migrate
    ```
-   View data:
    ```bash
    bun db:studio
    ```
