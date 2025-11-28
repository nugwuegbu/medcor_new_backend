#!/usr/bin/env python3
"""
Create simulation before/after images for Dentscape
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_simulation_images():
    """Create before/after simulation images"""
    
    # Ensure directory exists
    os.makedirs("static/dentscape", exist_ok=True)
    
    # Simulation images to create
    simulations = [
        ("before_orthodontics.jpg", "BEFORE\nOrthodontics Treatment\nTeeth Misaligned", (400, 300)),
        ("after_orthodontics.jpg", "AFTER\nOrthodontics Treatment\nPerfect Alignment", (400, 300)),
        ("before_veneer_whitening.jpg", "BEFORE\nVeneer + Whitening\nDiscolored Teeth", (400, 300)),
        ("after_veneer_whitening.jpg", "AFTER\nVeneer + Whitening\nBright White Teeth", (400, 300)),
        ("before_whitening.jpg", "BEFORE\nTooth Whitening\nYellow Teeth", (400, 300)),
        ("after_whitening.jpg", "AFTER\nTooth Whitening\nWhite Teeth", (400, 300)),
    ]
    
    for filename, text, size in simulations:
        # Create image with appropriate background color
        if "before" in filename:
            bg_color = (220, 200, 180)  # Slightly yellowish for "before"
        else:
            bg_color = (250, 250, 250)   # Bright white for "after"
        
        img = Image.new('RGB', size, color=bg_color)
        draw = ImageDraw.Draw(img)
        
        # Try to use a default font
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
        except:
            font = ImageFont.load_default()
        
        # Get text size for centering
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Calculate position to center text
        x = (size[0] - text_width) // 2
        y = (size[1] - text_height) // 2
        
        # Draw text
        draw.text((x, y), text, fill='black', font=font)
        
        # Draw a border
        draw.rectangle([0, 0, size[0]-1, size[1]-1], outline='gray', width=2)
        
        # Save image
        img.save(f"static/dentscape/{filename}")
        print(f"Created: static/dentscape/{filename}")
    
    print(f"\n✅ All simulation images created successfully!")
    print(f"📁 Location: static/dentscape/")
    print(f"🔗 These images will be accessible at: /static/dentscape/[filename]")

if __name__ == "__main__":
    create_simulation_images()




