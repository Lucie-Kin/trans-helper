#!/bin/bash
echo "Configuration système pour Elasticsearch..."
sudo sysctl -w vm.max_map_count=262144
if ! grep -q "vm.max_map_count" /etc/sysctl.conf; then
  echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
fi
echo "vm.max_map_count configuré"
echo "Enable Kibana"
sudo sysctl enable kibana

