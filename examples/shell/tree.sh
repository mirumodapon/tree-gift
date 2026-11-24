h=7
i=0
while [ $i -lt $h ]; do
  printf '%*s' $((h - 1 - i)) ''
  j=0; while [ $j -lt $((2 * i + 1)) ]; do printf '*'; j=$((j + 1)); done
  echo
  i=$((i + 1))
done
printf '%*s|\n' $((h - 1)) ''
