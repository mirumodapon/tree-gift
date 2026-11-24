package main

import (
	"fmt"
	"strings"
)

func main() {
	h := 7
	for i := 0; i < h; i++ {
		fmt.Println(strings.Repeat(" ", h-1-i) + strings.Repeat("*", 2*i+1))
	}
	fmt.Println(strings.Repeat(" ", h-1) + "|")
}
