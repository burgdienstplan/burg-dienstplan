#!/bin/bash

echo "Warte 30 Sekunden auf Netlify Deployment..."
sleep 30

API_URL="https://burg-dienstplan.netlify.app/.netlify/functions/api"

# Admin erstellen
echo "Erstelle Admin..."
curl -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","pin":"1234","rolle":"admin","aktiv":true}'
echo -e "\n"

# Max Mustermann erstellen
echo "Erstelle Max Mustermann..."
curl -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Max Mustermann","pin":"2222","rolle":"mitarbeiter","aktiv":true}'
echo -e "\n"

# Erika Musterfrau erstellen
echo "Erstelle Erika Musterfrau..."
curl -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Erika Musterfrau","pin":"3333","rolle":"mitarbeiter","aktiv":true}'
echo -e "\n"

# John Doe erstellen
echo "Erstelle John Doe..."
curl -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","pin":"4444","rolle":"mitarbeiter","aktiv":true}'
echo -e "\n"

echo "Fertig! Sie können sich jetzt einloggen mit:"
echo "Admin: PIN 1234"
echo "Max Mustermann: PIN 2222"
echo "Erika Musterfrau: PIN 3333"
echo "John Doe: PIN 4444"
