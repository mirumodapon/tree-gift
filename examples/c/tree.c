#include <stdio.h>
int main(void) {
    int h = 7;
    for (int i = 0; i < h; i++) {
        printf("%*s", h - 1 - i, "");
        for (int j = 0; j < 2 * i + 1; j++) putchar('*');
        putchar('\n');
    }
    printf("%*s|\n", h - 1, "");
    return 0;
}
