i=0
while true; do
  printf "\033[H\033[2J  *\n ***\n%5d\n" "$i"
  i=$((i + 1))
  sleep 0.2
done
