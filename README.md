# ChatGPT Visualiser 🌟

An immersive 3D visualisation tool for exploring ChatGPT conversation histories. Just for fun visualisation

🚀 **[Live on Vercel](https://chatgptvisualiser.vercel.app)**

![3D Visualisation Demo](https://img.shields.io/badge/3D-Visualisation-blue) ![React](https://img.shields.io/badge/React-TypeScript-blue) ![Three.js](https://img.shields.io/badge/Three.js-3D-green) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

## ✨ Features

- 🎮 **Immersive 3D Navigation** - WASD + Q/Z controls for smooth camera movement
- 🌟 **Beautiful Visual Effects** - Atmospheric glow effects with bloom post-processing
- 📱 **Responsive Design** - Works seamlessly across all devices and screen sizes
- 📊 **Smart Data Processing** - Automatic CSV conversion from ChatGPT JSON exports

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python 3.7+ (for data conversion)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd chatgpt-visualiser
   npm install
   ```

2. **Convert your ChatGPT data:**
   ```bash
   # Place your ChatGPT JSON export in the project folder
   python convert_json_to_csv.py conversations.json
   
   # For minimal CSV (recommended for large datasets):
   python convert_json_to_csv.py conversations.json --minimal
   ```

3. **Run the visualiser:**
   ```bash
   npm run dev
   ```

4. **Open your browser** to `http://localhost:5173`

## 🎮 Controls

| Key | Action |
|-----|--------|
| `W` | Move forward |
| `S` | Move backward |
| `A` | Move left |
| `D` | Move right |
| `Q` | Move up |
| `Z` | Move down |
| `Mouse` | Look around / Rotate camera |
| `Scroll` | Zoom in/out |
| `Click & Drag` | Interact with nodes |

## 📁 Data Format

### ChatGPT JSON Export
1. Go to ChatGPT Settings → Data Export
2. Download your conversation history
3. Extract the `conversations.json` file

### CSV Structure
The converter creates a CSV with these columns:
- `source`: Origin node ID
- `target`: Target node ID  
- `title`: Conversation title
- `timestamp`: When the conversation occurred
- `message_count`: Number of messages in conversation

## 🎨 Customization

### Visual Effects
Modify bloom and glow settings in `GraphVisualizer.tsx`:
```typescript
// Adjust bloom intensity
bloomPass.threshold = 0;
bloomPass.strength = 1.2;  // Glow strength
bloomPass.radius = 0.5;   // Glow radius

// Modify node glow
material.emissiveIntensity = 0.1;  // Regular nodes
rootMaterial.emissiveIntensity = 0.6;  // Central node
```

### Movement Controls
Adjust camera movement speed:
```typescript
const moveSpeed = 4;  // Increase for faster movement
```

### Color Scheme
Customize node colors:
```typescript
material.color.setHex(0x00ff88);      // Regular nodes (green)
rootMaterial.color.setHex(0xff6b6b);  // Central node (red)
```

## 🛠️ Development

### Project Structure
```
├── components/
│   ├── GraphVisualizer.tsx    # Main 3D visualisation
│   ├── FileUploadPrompt.tsx   # Data upload interface
│   └── SidePanel.tsx          # UI controls
├── services/
│   └── geminiService.ts       # AI integration
├── convert_json_to_csv.py     # Data conversion script
└── types.ts                   # TypeScript definitions
```

### Key Technologies
- **React + TypeScript** - Component framework
- **Three.js** - 3D rendering engine
- **react-force-graph-3d** - Graph visualisation
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework

### Build for Production
```bash
npm run build
```

## 🐛 Troubleshooting

### Common Issues

**Q: Nodes appear too bright/glowing**
- Reduce `emissiveIntensity` values in `GraphVisualizer.tsx`

**Q: Movement controls are too fast/slow**
- Adjust `moveSpeed` variable in the movement handler

**Q: Fullscreen mode not working**
- Try F11-key instead of F
- Check if browser permissions block fullscreen

**Q: CSV conversion fails**
- Ensure Python dependencies: `pip install pandas`
- Verify JSON file is valid ChatGPT export format

**Q: Performance issues with large datasets**
- Use `--minimal` flag when converting
- Consider filtering conversations by date range

### Performance Tips
- Use the minimal CSV option for datasets > 1000 conversations
- Close other browser tabs for better WebGL performance
- Enable hardware acceleration in browser settings


## 🤝 Contributing

Contributions welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.
