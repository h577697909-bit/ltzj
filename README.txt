Galaxy Strike: Neon Wings V12

Open index.html directly in a desktop or mobile browser.

Controls:
- PC: WASD / Arrow Keys to move, Space to cast skill, 1 / 2 / 3 to use battle items.
- Mobile: drag the aircraft, tap SKILL, and use the right-side item buttons.

V12 Updates:
- Added a password field to Returning Pilot / Sign In.
- Added Password and Confirm Password fields to Create Account.
- Sign In now requires matching Email + Password before loading the saved hangar profile.
- Existing local profiles without a password are migrated by setting a password on first sign-in from this device.
- Refined the Achievements card footer: cleaner progress display, larger progress bar, reward chip, status indicator, and better button states.
- Achievement buttons now use clearer states: Keep Playing, Collect Reward, and Collected.
- Mobile achievement cards stack the reward and action button cleanly.

Payment Script:
The game loads:
- https://www.roomilo.com/js/core/crypto-js.min.js
- https://www.roomilo.com/js/core/PayApi-v2.js
- pay.js

Supported payTypes in pay.js:
- Credit Card: 8004
- Apple Pay: 8003
- Google Pay: 8012

Data Storage:
This build uses browser localStorage. Player data is separated by email. Guest and Kids Mode use local device profiles.

Files:
- index.html
- pay.js
- README.txt
