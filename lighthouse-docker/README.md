# Lighthouse in Docker

> Run Lighthouse in a Docker container (as a CLI or a web service)

This folder contains example `Dockerfile`s for running Lighthouse using
[Headless Chrome](https://developers.google.com/web/updates/2017/04/headless-chrome)
and full Chrome. It can be used in cloud environments like [Google App Engine Flex](https://cloud.google.com/appengine/docs/flexible/nodejs/) (Node), AWS, etc.

Main source files:

- [`Dockerfile`](./Dockerfile) - Dockerfile for running Lighthouse using headless Chrome.
- [`Dockerfile.headful`](./Dockerfile.headful) - Dockerfile for running Lighthouse using full Chrome and xvfb.
- `server.js` - server for running Lighthouse as a REST web service (LHaas).

## Build it

Fire up Docker, then run:

```bash
yarn build
# or
# npm run build
```

**Dockerfile image size: ~740MB.**
**Dockerfile.headful image size: ~756MB.**

## Running the container

There are two ways to run the container:

1. Directly from the command line.
- By starting a web server, allowing you run Lighthouse using a REST API.

### Using the CLI

The container can be from the the CLI just like using the Lighthouse npm module. See
Lighthouse docs for [CLI options](../#cli-options).

```bash
# Audit example.com. Lighthouse results are printed to stdout.
docker run -it --rm --cap-add=SYS_ADMIN lighthouse_docker https://example.com

# Audits example.com and saves HTML report to a file.
docker run -it --rm --cap-add=SYS_ADMIN lighthouse_docker --quiet https://example.com > report.html

# Audits example.com and saves JSON results to a file.
docker run -it --rm --cap-add=SYS_ADMIN lighthouse_docker --quiet --output=json https://example.com > report.json

# Print the Lighthouse version used by the container.
docker run -it --rm --cap-add=SYS_ADMIN lighthouse_docker --version

# Print Lighthouse help
docker run -it --rm --cap-add=SYS_ADMIN lighthouse_docker --help
```

### Using the REST API web service

The container also bundles a web server that supports a REST API. You can
use it to run Lighthouse return scores...in the cloud!

To run the web server, invoke `docker run` without any arguments (e.g. no `CMD`):

```bash
docker run -dit -p 8080:8080 --rm --name lighthouse_docker --cap-add=SYS_ADMIN lighthouse_docker
```

There are also npm script helpers for starting and building + restarting the server:

```bash
yarn serve
# or
# npm run serve

# Re-build and start the server again.
yarn restart
# or
# npm run restart
```

This starts a server on `8080` and exposes a REST endpoint at `http://localhost:8080/audit`.

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

## Using full Chrome instead of headless Chrome

By default, the `Dockerfile` launches headless Chrome to run Lighthouse. If you
want to use full "headful" Chrome, build the image using `Dockerfile.headful`.

Build it:

```bash
yarn build:headful
# or
# npm run build:headful
```

Run the CLI:

```bash
docker run -it --rm --cap-add=SYS_ADMIN lighthouse_docker_headful https://example.com
```

Run the web server:

```bash
yarn serve:headful
# or
#npm run serve:headful
```

Everything else remains the same.
