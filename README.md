# Mac Gamepad Controller

A web-based Nintendo Switch-style controller that lets you control your Mac using your phone's touchscreen. Features include dual analog sticks, full button mapping, and haptic feedback.

## Features

- Nintendo Switch Joy-Con style interface
- Dual analog sticks with 8-directional control
- Full button mapping (A, B, X, Y, L, R, ZL, ZR)
- D-pad support
- Haptic feedback on button press
- Real-time connection status
- Fullscreen mode with landscape lock
- Touch-optimized controls

## Prerequisites

- Node.js 14+ installed on your Mac
- iOS/Android device with a modern web browser
- Mac and phone must be on the same network

## Installation

### Server Setup (On Mac)

1. Clone the repository:

```bash
git clone <your-repo-url>
cd mac-gamepad
```

2. Install server dependencies:

```bash
cd server
npm install express socket.io cors
npm install --arch=arm64 --unsafe-perm # For M1/M2 Macs
```

3. Install PM2 globally:

```bash
npm install -g pm2
```

### Client Setup

1. Install client dependencies:

```bash
cd client
npm install
```

## Configuration

1. Find your Mac's local IP address:

   - Open System Settings > Network
   - Note down your IP address (e.g., 192.168.1.X)

2. Update the client configuration:
   - Open `client/src/components/SwitchController.jsx`
   - Update the socket connection URL with your Mac's IP:
   ```javascript
   const socket = io("http://your-mac-ip:3001");
   ```

## Running the Application

### Start the Server

1. Using PM2:

```bash
cd server
pm2 start server.js --name "gamepad-server"

# Additional PM2 commands:
pm2 status              # Check server status
pm2 logs gamepad-server # View logs
pm2 stop gamepad-server # Stop server
```

2. Enable auto-start (optional):

```bash
pm2 startup
pm2 save
```

### Start the Client

1. Development mode:

```bash
cd client
npm run dev
```

2. Production build:

```bash
npm run build
npm run start
```

## Permissions Setup

1. Open System Settings > Privacy & Security > Accessibility
2. Click the lock icon to make changes
3. Add permissions for:
   - Terminal.app (or iTerm)
   - Node.js
   - PM2 (if using it)

## Usage

1. On your Mac:

   - Start the server using PM2
   - Ensure it's running (`pm2 status`)

2. On your phone:
   - Connect to the same WiFi as your Mac
   - Open browser and navigate to `http://your-mac-ip:3000`
   - Click "Enter Fullscreen" for better experience
   - Use the controller!

## Key Mappings

Default key mappings:

- Left Analog: WASD
- Right Analog: Arrow Keys
- A: Z
- B: X
- X: C
- Y: V
- L: Q
- R: E
- ZL: 1
- ZR: 3
- Plus: =
- Minus: -
- Home: Escape

## Troubleshooting

### Common Issues

1. Controller not connecting:

   - Verify both devices are on same network
   - Check Mac's firewall settings
   - Verify correct IP address is being used

2. Keys not working:

   - Check accessibility permissions
   - Restart the server
   - Check server logs: `pm2 logs gamepad-server`

3. Laggy response:
   - Ensure good WiFi connection
   - Close other bandwidth-heavy applications

## Development

### Project Structure

```
mac-gamepad/
├── server/
│   ├── server.js
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── SwitchController.jsx
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests, please create an issue in the repository.
