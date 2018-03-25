#!/bin/bash

# Pass the `--headful` flag to build an image that runs Lighthouse with full
# Chrome instead of headless Chrome: ./docker_build.sh --headful

if [ "$1" == "--headful" ]; then
  docker build -f Dockerfile.headful -t lighthouse_docker_headful . --build-arg CACHEBUST=$(date +%d)
else
  docker build -t lighthouse_docker . --build-arg CACHEBUST=$(date +%d)
fi
