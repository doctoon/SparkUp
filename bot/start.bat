@echo off
:loop
echo Starting SparkUp... (use ctrl+c to stop)
nodemon -q index.mjs
echo Bot crashed or stopped. Restarting...
goto loop
