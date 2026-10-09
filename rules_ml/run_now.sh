#!/bin/sh
# Smoke-check first (same code path), then the real fine-tune.
cd /home/tt/Documents/Ultimafia/rules_ml || exit 1

{
  echo "=== runner $(date) ==="
} > finetune_run.log

SMOKE=1 /home/tt/.venvs/ultima-ml/bin/python -u finetune.py > smoke.log 2>&1
echo "smoke exit=$?" >> finetune_run.log
tail -8 smoke.log >> finetune_run.log

if grep -q "SMOKE OK" smoke.log; then
  echo "=== full run starting $(date) ===" >> finetune_run.log
  /home/tt/.venvs/ultima-ml/bin/python -u finetune.py > finetune.log 2>&1
  rc=$?
  echo "=== full run exit=$rc finished $(date) ===" >> finetune_run.log
  tail -30 finetune.log >> finetune_run.log
else
  echo "=== SMOKE FAILED - full run NOT started ===" >> finetune_run.log
fi
