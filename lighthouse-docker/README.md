# Lighthouse in Docker

> Run Lighthouse in a Docker container (as a CLI or a web service)

This folder contains example `Dockerfile`s for running Lighthouse using
[Headless Chrome](https://developers.google.com/web/updates/2017/04/headless-chrome)
and full Chrome. It can be used in cloud environments like [Google App Engine Flex](https://cloud.google.com/appengine/docs/flexible/nodejs/) (Node), AWS, etc.

Main source files:

- [`Dockerfile`](./Dockerfile) - Dockerfile for running Lighthouse using headless Chrome.
- [`entrypoint.sh`](./entrypoint.sh) - main entrypoint for the container.
- [`server.js`](./server.js) - server for running Lighthouse as a REST web service (LHaas).

## Usage

Pull the pre-built image from [Dockerhub](https://hub.docker.com/):

```bash
docker pull GoogleChrome/lighthouse
```

> **Image size: ~805MB.**

There are two ways to run the container:

1. As a CLI.
- As a REST API web service.

### Using the CLI

The container can be from the the CLI just like using the Lighthouse npm module. See
Lighthouse docs for [CLI options](../#cli-options).

```bash
# Audit example.com. Lighthouse results are printed to stdout.
docker run -it --rm --cap-add=SYS_ADMIN GoogleChrome/lighthouse https://example.com

# Audits example.com and saves HTML report to a file.
docker run -it --rm --cap-add=SYS_ADMIN GoogleChrome/lighthouse --quiet https://example.com > report.html

# Audits example.com and saves JSON results to a file.
docker run -it --rm --cap-add=SYS_ADMIN GoogleChrome/lighthouse --quiet --output=json https://example.com > report.json

# Print the Lighthouse version.
docker run -it --rm --cap-add=SYS_ADMIN GoogleChrome/lighthouse --version

# Print Lighthouse CLI help.
docker run -it --rm --cap-add=SYS_ADMIN GoogleChrome/lighthouse --help
```

### Using the REST API web service

The container also bundles a web server that supports a REST API. You can
use it to run Lighthouse return scores...in the cloud!

To run the web server, invoke `docker run` without any arguments (e.g. no `CMD`):

```bash
docker run -dit -p 8080:8080 --rm --name GoogleChrome/lighthouse --cap-add=SYS_ADMIN GoogleChrome/lighthouse
```

This starts a server on `8080` and exposes a REST endpoint at
`http://localhost:8080/audit`.

**Examples**

The endpoint supports `GET` requests with the following URL parameters:

- `url`: parameter for the page you want to test.
- `output`: report format. One of `json` or `html`.
- `nolog`: By default, logs are streamed as Lighthouse audits the page.
   Once the report is ready, the page redirects to the final report. If you
   don't want this feature or your hosting env doesn't support [Server
   Sent Events](https://www.html5rocks.com/en/tutorials/eventsource/basics/),
   include the `nolog` parameter.

```bash
http://localhost:8080/audit?url=https://example.com&output=html
http://localhost:8080/audit?url=https://example.com&output=json
http://localhost:8080/audit?url=https://example.com&output=json&nolog
```

The endpoint also supports `POST` requests with the same parameters. The only
difference is that `POST` requests do not stream logs.

Instead of URL query parameters, send JSON with the same param names:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  --data '{"output": "json", "url": "https://example.com"}' \
  http://localhost:8080/audit
```

## Development

> Build the image locally

Fire up Docker and run:

```bash
yarn build
# npm run build
```

There are convenient npm scripts for that run `docker run` for you.

Start the web service:

```bash
yarn serve
# npm run serve
```

Build the image and restarts the Node server:

```bash
yarn restart
# npm run restart
```

## Misc

### Chrome version

Print the User-Agent string of the Chrome version used in the container.

```bash
yarn chrome:version
# Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/67.0.3381.0 Safari/537.36
```

### Using full Chrome instead of headless Chrome

Check out the [`headful/Dockerfile`](./headful/Dockerfile) for example running
Lighthouse with full ("headful") Chrome using xvfb as display.

##### Why full Chrome instead of headless Chrome?

In some cases you may want to use full Chrome with Lighthouse rather than having
it launch headless Chrome.

1. Headless Chrome doesn't support the GPU.
- Some sites detect that the browser is being run in a headless/automation mode
and change their behavior.
- In some cases, there may be slight rendering differences between headless
Chrome and full Chrome. Most of the time, these are just bugs in headless Chrome.

#### Usage

Build it:

```bash
./docker_build.sh --headful

# or
yarn build:headful
# npm run build:headful
```

Run the CLI:

```bash
docker run -it --rm --cap-add=SYS_ADMIN lighthouse_headful https://example.com
```

Run the web server:

```bash
yarn serve:headful
# npm run serve:headful
```

Everything else remains the same.