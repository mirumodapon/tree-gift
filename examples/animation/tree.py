# ANSI 動畫範例：燈光會閃爍的聖誕樹（約 3 秒）
import time

GREEN, RESET = "\033[32m", "\033[0m"
LIGHTS = ["\033[91m", "\033[93m", "\033[94m", "\033[95m"]
HEIGHT = 8

print("\033[?25l\033[2J", end="")  # 隱藏游標、清畫面
for frame in range(12):
    print("\033[H", end="")  # 游標回到左上角，重畫整棵樹
    print(" " * (HEIGHT - 1) + LIGHTS[frame % 4] + "★" + RESET)
    for i in range(1, HEIGHT):
        row = ""
        for j in range(2 * i - 1):
            if (i * 7 + j + frame) % 6 == 0:
                row += LIGHTS[(i + j + frame) % 4] + "o" + GREEN
            else:
                row += "*"
        print(" " * (HEIGHT - 1 - i) + GREEN + row + RESET)
    print(" " * (HEIGHT - 2) + "\033[33m|||" + RESET)
    time.sleep(0.25)
print("\033[?25h", end="")  # 恢復游標
