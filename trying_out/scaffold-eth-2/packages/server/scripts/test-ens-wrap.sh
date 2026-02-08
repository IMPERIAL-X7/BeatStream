#!/bin/bash
# Test ENS after wrapping beatstream.eth
BASE="http://localhost:4000"

echo "=== 1. Check beatstream.eth (wrapped — should be registered) ==="
curl -s "$BASE/api/ens/check/beatstream.eth" | python3 -m json.tool
echo ""

echo "=== 2. Resolve beatstream.eth ==="
curl -s "$BASE/api/ens/resolve/beatstream.eth" | python3 -m json.tool
echo ""

echo "=== 3. Try registering artist subdomain (synthwave.beatstream.eth) ==="
echo '  (This calls NameWrapper.setSubnodeRecord — the real test)'
# We need a valid artist wallet + signature. Let's use the seed artist wallet.
# First get the seed artist to find their wallet:
echo "  Fetching artists to find a wallet..."
ARTIST_RESP=$(curl -s "$BASE/api/artists")
echo "$ARTIST_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
artists = data.get('artists', [])
if artists:
    a = artists[0]
    print(f'  Artist: {a[\"display_name\"]}')
    print(f'  Wallet: {a[\"wallet_address\"]}')
    print(f'  ENS: {a.get(\"ens_name\", \"N/A\")}')
    print(f'  ENS Registered: {a.get(\"ens_registered\", False)}')
else:
    print('  No artists found')
"
echo ""

echo "=== 4. Check synthwave.beatstream.eth ==="
curl -s "$BASE/api/ens/check/synthwave.beatstream.eth" | python3 -m json.tool
echo ""

echo "=== 5. GET /api/status (check ENS section) ==="
curl -s "$BASE/api/status" | python3 -c "
import sys, json
data = json.load(sys.stdin)
ens = data.get('ens', {})
print(json.dumps(ens, indent=2))
"
echo ""
echo "=== DONE ==="
