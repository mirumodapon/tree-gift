import time

# 沒有 flush=True：在 pty 中 print 是行緩衝，每一行都會即時送出
for i in range(6):
    print("\033[H" + " " * i + "*")
    time.sleep(0.15)
