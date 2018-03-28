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

# Using full Chrome in Docker requires us to start xvfb and launch our own
# instance of Chrome.

/etc/init.d/dbus start

Xvfb :99 -ac -screen 0 1280x1024x24 -nolisten tcp &
xvfb=$!
export DISPLAY=:99

TMP_PROFILE_DIR=$(mktemp -d -t lighthouse.XXXXXXXXXX)

su chrome /chromeuser-script.sh

if [ -z "$1" ]; then
  npm run start
else
  lighthouse --port=9222 --output-path=stdout $@
fi
