#include <stdio.h>
#include "layer.h"
void layer(int i, int h) { printf("%*s", h - 1 - i, ""); for (int j = 0; j < 2 * i + 1; j++) putchar(42); putchar(10); }
