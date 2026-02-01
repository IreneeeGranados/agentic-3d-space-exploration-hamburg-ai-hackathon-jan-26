# Teleport Marker - Visual Preview

## What You'll See

When you teleport, a **cyan targeting reticle** appears on the planet:

```
                    ╔═══════════════════════════════╗
                    ║  TELEPORT TARGET ACQUIRED    ║
                    ╚═══════════════════════════════╝

                             ┃
                             ┃
                  ╔══════════╪══════════╗
                  ║          ┃          ║
                  ║          ┃          ║
            ──────╫──────────⊕──────────╫──────
                  ║          ┃          ║
                  ║          ┃          ║
                  ╚══════════╪══════════╝
                             ┃
                             ┃

            [Animated Pulsing Cyan Crosshair]
                    ↓
              🪐 Planet Here
```

## Size Comparison

### Small Planet (Mercury)
```
     ⊕
     •  ← Marker larger than planet (easy to spot)
```

### Earth-sized
```
    ⊕
    ⚫  ← Marker proportional
```

### Gas Giant (Jupiter)
```
      ⊕
      ⬤  ← Marker scales with planet
```

## Animation

```
Frame 1:  ⊕  (opacity 40%, scale 85%)
           
Frame 2:  ⊕  (opacity 70%, scale 100%)
           
Frame 3:  ⊕  (opacity 100%, scale 115%)
           
Frame 4:  ⊕  (opacity 70%, scale 100%)
           
[Loops continuously]
```

## Color Palette

```css
Primary:   #00ffff (Cyan)        ███ Bright, stands out
Glow:      rgba(0,255,255,0.8)  ▓▓▓ Outer aura
Fade:      rgba(0,255,255,0)    ░░░ Soft edge
```

## In-Game View

```
╔════════════════════════════════════════════════════════════╗
║  [Space Scene - Dark Background]                          ║
║                                                            ║
║                         * .    *                           ║
║          *     .                                           ║
║                             ⊕                              ║
║    .        *           ╱   ╲        *        .          ║
║                        ╱  ⊕  ╲                            ║
║        *              ╱   │   ╲           *               ║
║                      ├────┼────┤                          ║
║            .         ╲   │   ╱        .                   ║
║                       ╲  ⊕  ╱                             ║
║   *                    ╲   ╱      *                       ║
║                         ⊕                                  ║
║        .      *              .           *                ║
║                                                            ║
║  🚀 Spacecraft                    Jupiter ⬤ with marker   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

## States

### Active (0-15 seconds)
```
⊕  Pulsing, 100% visible, animated
```

### Fading (15+ seconds)
```
⊕  Fades out and disappears
```

### New Teleport
```
Old marker removed → New marker appears ⊕
```

## Marker Components

```
     ┃           Top crosshair
   ┌─╫─┐         Top-left bracket
   │ ║ │         Outer ring
───┤ ⊕ ├───      Left/Right crosshairs + center
   │ ║ │         Inner ring
   └─╫─┘         Bottom-left bracket
     ┃           Bottom crosshair
```

## Perfect For

✓ Finding small planets  
✓ Confirming teleport destination  
✓ Visual feedback  
✓ Navigation reference  
✓ Sci-fi immersion  

## Keyboard Shortcut

Press **T** → Open Navigator  
Select Planet → Teleport  
**⊕ Marker appears!**

---

🎯 **Target Acquired!**
