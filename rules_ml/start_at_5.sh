#!/bin/sh
# Wait until 05:00 local time, then run the MiniLM fine-tune.
# Launched as a tracked background job; nohup/setsid not needed because the
# invoking wsl.exe stays alive for the lifetime of the job.
cd /home/tt/Documents/Ultimafia/rules_ml || exit 1

target=$(date -d "today 05:00" +%s)
now=$(date +%s)
wait=$(( target - now ))
if [ "$wait" -lt 0 ]; then wait=$(( wait + 86400 )); fi

{
  echo "=== fine-tune scheduler ==="
  echo "now:    $(date)"
  echo "target: $(date -d @$target)"
  echo "sleep:  ${wait}s"
} > finetune_run.log

sleep "$wait"

echo "=== starting $(date) ===" >> finetune_run.log
/home/tt/.venvs/ultima-ml/bin/python -u finetune.py > finetune.log 2>&1
rc=$?
echo "=== finished $(date) exit=$rc ===" >> finetune_run.log
tail -25 finetune.log >> finetune_run.log
