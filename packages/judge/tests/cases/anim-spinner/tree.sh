for f in "|" "/" "-" "\\" "|" "/" "-" "\\"; do
  printf "\r %s loading" "$f"
  sleep 0.1
done
printf "\r * done   \n"
