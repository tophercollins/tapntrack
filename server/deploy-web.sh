#!/bin/bash
# Build the PWA for production and publish it to the Caddy web root.
# Run after changing frontend code. Caddy serves /var/www/tapntrack at https://tapntrack.annanil.com.
set -euo pipefail
cd /home/topher/Projects/tapntrack
VITE_API_URL=https://tapntrack.annanil.com npm run build
sudo mkdir -p /var/www/tapntrack
sudo rsync -a --delete dist/ /var/www/tapntrack/
sudo chmod -R a+rX /var/www/tapntrack
echo "deployed dist → /var/www/tapntrack ($(sudo find /var/www/tapntrack -type f | wc -l) files)"
