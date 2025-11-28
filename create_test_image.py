#!/usr/bin/env python3
"""
Create a proper test image that meets Dentscape requirements
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_test_image(filename, size=(1000, 1000)):
    """Create a test image that meets Dentscape requirements"""
    # Create image with proper size and brightness
    img = Image.new('RGB', size, color=(180, 180, 180))  # Medium brightness
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
    except:
        font = ImageFont.load_default()
    
    # Draw text
    text = "Dentscape Test Image\nMeets Requirements\n800x800+ Resolution\nProper Brightness"
    
    # Get text size for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Calculate position to center text
    x = (size[0] - text_width) // 2
    y = (size[1] - text_height) // 2
    
    # Draw text
    draw.text((x, y), text, fill='black', font=font)
    
    # Draw some shapes to make it look more like a dental image
    # Draw a circle (representing mouth)
    center_x, center_y = size[0] // 2, size[1] // 2
    radius = 200
    draw.ellipse([center_x - radius, center_y - radius, 
                  center_x + radius, center_y + radius], 
                 outline='darkgray', width=5)
    
    # Draw some lines (representing teeth)
    for i in range(8):
        y_pos = center_y - radius + 20 + (i * 30)
        draw.line([center_x - 150, y_pos, center_x + 150, y_pos], 
                 fill='lightgray', width=3)
    
    # Draw a border
    draw.rectangle([0, 0, size[0]-1, size[1]-1], outline='black', width=3)
    
    # Save image
    img.save(filename, quality=95)
    print(f"Created test image: {filename}")
    print(f"Size: {size[0]}x{size[1]} pixels")
    print(f"Brightness: Medium (should be in 50-200 range)")

def main():
    """Create test image"""
    
    # Ensure directory exists
    os.makedirs("static/dentscape", exist_ok=True)
    
    # Create a proper test image
    test_image_path = "static/dentscape/test_image.jpg"
    create_test_image(test_image_path, size=(1000, 1000))
    
    print(f"\n✅ Test image created successfully!")
    print(f"📁 Location: {test_image_path}")
    print(f"🔗 This image should pass Dentscape validation requirements")

if __name__ == "__main__":
    main()




