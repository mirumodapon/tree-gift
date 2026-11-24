#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 編譯階段有 1g，執行時必須已降回 256m
int main(void) {
    size_t n = (size_t)512 << 20;
    char *p = malloc(n);
    if (!p) return 1;
    memset(p, 1, n);
    long sum = 0;
    for (size_t i = 0; i < n; i += 4096) sum += p[i];
    printf("%ld\n", sum);
    return 0;
}
