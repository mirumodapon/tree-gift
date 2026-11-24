import random, time

for _ in range(5):
    print("\033[H" + "*" * random.randint(1, 40))
    time.sleep(0.1)
