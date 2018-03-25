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

# Pass the `--headful` flag to build an image that runs Lighthouse with full
# Chrome instead of headless Chrome: ./docker_build.sh --headful

if [ "$1" == "--headful" ]; then
  docker build -f Dockerfile.headful -t lighthouse_docker_headful . --build-arg CACHEBUST=$(date +%d)
else
  docker build -t lighthouse_docker . --build-arg CACHEBUST=$(date +%d)
fi
