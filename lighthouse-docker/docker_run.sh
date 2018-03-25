#!/bin/bash

if [ "$1" == "--headful" ]; then
  docker kill lighthouse_docker_headful
  docker run -dit -p 8080:8080 --rm --name lighthouse_docker_headful --cap-add=SYS_ADMIN lighthouse_docker_headful
else
  docker kill lighthouse_docker
  docker run -dit -p 8080:8080 --rm --name lighthouse_docker --cap-add=SYS_ADMIN lighthouse_docker
fi
