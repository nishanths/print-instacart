## What is this?

Modifies the Instacart orders page to make nicer-looking PDFs.

See the `example` directory for the difference.

## Why?

So I can email my parents the list of things I ordered without it being
an eyesore.

## Usage

1. Visit an orders page
	```
  	https://www.instacart.com/store/orders/<id>
	```
2. Run the bookmarklet in the `fix.min.js` file.
3. Save the page as a PDF from your browser's print dialog


## Local development

1. Edit `proxyURL` in fix.ts to point to the local server
2. Start Google Chrome; if the local server doesn't use https, include
   the `--allow-running-insecure-content` flag
3. Run the local proxy server

    ```
    go run proxy.go
    ```

4. Paste the script into the console


## I want to use my own proxy server

Edit `proxyURL` in fix.ts with the address of your server. Then run
`make bookmarklet` to re-generate the bookmarklet.
