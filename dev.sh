tmux new-session -d -s npm_starts -x "$(tput cols)" -y "$(tput lines)" "npm run dev:web"
tmux split-window -h -t npm_starts:0 "nodemon --watch 'server/**/*.js' --exec 'npm run dev:server'"
tmux set-window-option -t npm_starts synchronize-panes on
tmux attach-session -t npm_starts
tmux kill-session -t npm_starts