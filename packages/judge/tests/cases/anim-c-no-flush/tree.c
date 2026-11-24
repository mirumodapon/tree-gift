#include <stdio.h>
#include <unistd.h>

// 沒有 fflush：在 pty 中 stdout 是行緩衝，每一行都會即時送出
int main(void) {
    for (int i = 0; i < 6; i++) {
        printf("\033[H%*s*\n", i, "");
        usleep(150000);
    }
    return 0;
}
