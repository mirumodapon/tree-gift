GREEN, YELLOW, RED, BROWN, RESET = "\033[32m", "\033[93m", "\033[31m", "\033[33m", "\033[0m"
H = 8
print(" " * (H - 1) + YELLOW + "★" + RESET)
for i in range(1, H):
    row = "".join(RED + "o" + GREEN if (i * 7 + j) % 5 == 0 else "*" for j in range(2 * i - 1))
    print(" " * (H - 1 - i) + GREEN + row + RESET)
print(" " * (H - 2) + BROWN + "|||" + RESET)
print(" " * (H - 6) + "Merry Christmas!")
