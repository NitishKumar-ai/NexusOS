#!/bin/bash
# Phase 3 Verification Script

GATEWAY_URL="http://localhost:3000"

echo "1. Starting NexusOS Traffic Controller..."
cd packages/traffic-controller
cargo run &
GATEWAY_PID=$!
sleep 5

echo "2. Submitting a new mission with OpenClaw metadata..."
MISSION=$(curl -s -X POST $GATEWAY_URL/api/v1/agents/coder/run \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Test Phase 3 implementation",
    "metadata": {
      "openclaw_session": "test-session-123",
      "source_channel": "terminal",
      "user_id": "tester"
    }
  }')

echo "Response: $MISSION"
TASK_ID=$(echo $MISSION | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TASK_ID" ]; then
  echo "❌ Failed to create mission"
  kill $GATEWAY_PID
  exit 1
fi

echo "Task ID: $TASK_ID"

echo "3. Waiting for P2Pending state..."
for i in {1..10}; do
  STATUS=$(curl -s $GATEWAY_URL/api/v1/missions/$TASK_ID)
  PHASE=$(echo $STATUS | grep -o '"phase":"[^"]*"' | cut -d'"' -f4)
  echo "Current Phase: $PHASE"
  if [ "$PHASE" == "P2Pending" ]; then
    echo "✅ Mission is at P2Pending"
    break
  fi
  sleep 2
done

if [ "$PHASE" != "P2Pending" ]; then
  echo "❌ Mission did not reach P2Pending"
  kill $GATEWAY_PID
  exit 1
fi

echo "4. Approving mission at P2 gate..."
APPROVE=$(curl -s -X POST $GATEWAY_URL/api/v1/missions/$TASK_ID/approve \
  -H "Content-Type: application/json" \
  -d '{"note": "approved from test script"}')
echo "Approval Response: $APPROVE"

echo "5. Verifying advancement to P3Architecture..."
sleep 2
STATUS=$(curl -s $GATEWAY_URL/api/v1/missions/$TASK_ID)
PHASE=$(echo $STATUS | grep -o '"phase":"[^"]*"' | cut -d'"' -f4)
echo "Current Phase: $PHASE"

if [ "$PHASE" == "P3Architecture" ] || [ "$PHASE" == "P4Execution" ]; then
  echo "✅ Mission advanced successfully"
else
  echo "❌ Mission failed to advance. Phase: $PHASE"
  kill $GATEWAY_PID
  exit 1
fi

echo "6. Cleaning up..."
kill $GATEWAY_PID
echo "✅ Verification complete!"
