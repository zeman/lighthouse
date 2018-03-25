#!/bin/sh

# Copyright 2018 Google Inc. All Rights Reserved.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

if [ "$1" == "--headful" ]; then
  docker kill lighthouse_docker_headful
  docker run -dit -p 8080:8080 --rm --name lighthouse_docker_headful --cap-add=SYS_ADMIN lighthouse_docker_headful
else
  docker kill lighthouse_docker
  docker run -dit -p 8080:8080 --rm --name lighthouse_docker --cap-add=SYS_ADMIN lighthouse_docker
fi
