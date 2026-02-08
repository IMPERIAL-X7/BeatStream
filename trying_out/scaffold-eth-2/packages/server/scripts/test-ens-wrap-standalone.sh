#!/bin/bash
# Self-contained: starts server, runs tests, kills server
set -e

SERVER_DIR="/home/imperial-x/Documents/GitHub/BeatStream/trying_out/scaffold-eth-2/packages/server"
BASE="http://localhost:4000"

# Kill anything on port 4000
lsof -ti :4000 | xargs -r kill 2>/dev/null || true
sleep 1

# Start server in background
cd "$SERVER_DIR"
npx tsx src/index.ts > /tmp/beatstream-server.log 2>&1 &
SERVER_PID=$!

echo "⏳ Waiting for server (PID $SERVER_PID)..."
for i in $(seq 1 15); do
  if curl -s "$BASE/api/health" >/dev/null 2>&1; then
    echo "✅ Server is ready!"
    break
  fi
  if [ "$i" -eq 15 ]; then
    echo "❌ Server did not start in time"
    cat /tmp/beatstream-server.log
    kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  🧪 ENS Wrap Verification Tests        ║"
echo "╚════════════════════════════════════════╝"
echo ""

echo "─── 1. Check beatstream.eth (should be registered/wrapped) ───"
curl -s "$BASE/api/ens/check/beatstream.eth" | python3 -m json.tool
echo ""

echo "─── 2. Resolve beatstream.eth ───"
curl -s "$BASE/api/ens/resolve/beatstream.eth" | python3 -m json.tool
echo ""

echo "─── 3. Check synthwave.beatstream.eth (not yet created) ───"
curl -s "$BASE/api/ens/check/synthwave.beatstream.eth" | python3 -m json.tool
echo ""

echo "─── 4. Artist list (check seed data) ───"
curl -s "$BASE/api/artists" | python3 -c "
import sys, json
data = json.load(sys.stdin)
artists = data.get('artists', [])
for a in artists:
    print(f'  {a[\"display_name\"]:20s} wallet={a[\"wallet_address\"][:12]}... ens={a.get(\"ens_name\", \"N/A\")} registered={a.get(\"ens_registered\", False)}')
" 2>/dev/null || echo "  (no artists)"
echo ""

echo "─── 5. ENS status ───"
curl -s "$BASE/api/status" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(json.dumps(data.get('ens', {}), indent=2))
"
echo ""

# Check server logs for any ENS-related output
echo "─── 6. Server logs (ENS lines) ───"
grep -i "ens\|namewrap\|subdomain" /tmp/beatstream-server.log || echo "  (no ENS log lines)"
echo ""

echo "════════════════════════════════════════"
echo "  Tests complete!"
echo "════════════════════════════════════════"

# Cleanup
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
echo "🛑 Server stopped."
